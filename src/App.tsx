import { v4 as uuid } from "@lukeed/uuid";
import clsx from "clsx";
import { isToday } from "date-fns";
import { LayoutGroup, motion, useScroll } from "framer-motion";
import React, { FormEvent, useEffect, useRef, useState } from "react";
import { I18nProvider, useDateFormatter } from "react-aria";
import { flushSync } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { useElementSize, useMediaQuery } from "usehooks-ts";
import * as Y from "yjs";
import AutosizeTextarea from "./components/AutosizeTextarea";
import DateFormatter from "./lib/DateFormatter";
import { useTheme } from "./lib/useTheme";
import { yjs } from "./lib/yjs";

const NEW_NOTE_TITLE = "New Note";
function createNewNote(
  ynotes: Y.Array<{
    id: string;
    createdAt: number;
    updatedAt: number;
    title: string;
  }>
) {
  const _id = uuid();
  ynotes.push([
    {
      id: _id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      title: NEW_NOTE_TITLE,
    },
  ]);
  return _id;
}

type Message = { data: string; id: string };

function Texting(props: { id: string }) {
  const [messages, ymessages] = yjs.useArray<Message>(`messages.${props.id}`);
  const [messageMeta, ymessageMeta] = yjs.useMap<{
    id: string;
    title?: string;
  }>(`messageMeta.${props.id}`);
  const [notes, ynotes] = yjs.useArray<{
    id: string;
    createdAt: number;
    updatedAt: number;
    title: string;
  }>("notes");
  const [message, setMessage] = useState("");
  const [animationMessageId, setAnimationMessageId] = useState<string | null>();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { scrollY } = useScroll({
    container: scrollRef,
  });
  const ydoc = yjs.useYDoc();
  const [textareaKey, setTextareaKey] = useState(0);
  const [textareaWrapperMeasurerRef, { height: textareaHeight }] =
    useElementSize<HTMLDivElement>();
  const matches = useMediaQuery("(min-width: 768px)");
  const isMobile = !matches;
  const theme = useTheme();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ymessages || !message || !notes || !ydoc) {
      return;
    }

    const showAnimation = scrollY.get() > -100;
    const messageId = uuid();
    showAnimation && setAnimationMessageId(messageId);
    setTimeout(() => {
      ydoc.transact(() => {
        const noteIndex = notes.findIndex((n) => n.id === props.id);
        const note = notes[noteIndex];
        ynotes?.delete(noteIndex);
        ynotes?.insert(0, [
          {
            ...note,
            updatedAt: Date.now(),
            title: messageMeta?.title || message,
          },
        ]);
        if (!messageMeta?.title) {
          ymessageMeta?.set("title", message as any);
        }
        ymessages.push([{ data: message, id: messageId }]);
      });
      showAnimation && setAnimationMessageId(null);
      flushSync(() => {
        setTextareaKey(textareaKey + 1);
        setMessage("");
      });
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      });
    });
  }

  useEffect(() => {
    textareaRef.current?.focus();
  }, [props.id, textareaKey]);

  return (
    <div className="flex flex-col-reverse h-full grow relative min-w-screen md:min-w-0 snap-center">
      {/* <button onClick={() => ymessages?.delete(0, messages?.length)}>
          💥
        </button> */}
      {typeof messages !== "undefined" && (
        <div
          className={clsx(
            "inset-0 absolute grid place-content-center text-neutral-700 dark:text-neutral-300 font-bold transition-opacity",
            {
              "opacity-100": messages.length === 0,
              "opacity-0 pointer-events-none touch-none": messages.length > 0,
            }
          )}
          aria-hidden={messages.length > 0}
          onClick={() => textareaRef.current?.focus()}
        >
          Start writing 🪶👇
        </div>
      )}

      <LayoutGroup>
        <div
          className="px-4 pb-4 pt-2 inset-x-0 absolute bg-white/50 dark:bg-neutral-900/50 backdrop-blur-lg"
          ref={textareaWrapperMeasurerRef}
        >
          <form
            onSubmit={onSubmit}
            className="flex"
            onClick={() => textareaRef.current?.focus()}
          >
            <div className="border border-neutral-300 dark:border-neutral-700 rounded-[16px] pl-3 pr-1 py-0.5 w-full flex items-center backdrop-blur-3xl">
              <AutosizeTextarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="focus:outline-none text-base md:text-sm grow dark:text-white text-neutral-900 bg-transparent mb-0.5"
                rows={1}
                key={textareaKey}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    if (!isMobile || e.metaKey) {
                      onSubmit(e);
                    }
                  }
                }}
                ref={textareaRef}
              />
              {isMobile && (
                <button
                  className="rounded-full h-[22px] ml-2 w-auto bg-[#0b93f6] aspect-square focus:outline-none grid place-content-center"
                  aria-label="Send"
                >
                  <span className="i-material-symbols-arrow-upward-rounded text-white" />
                </button>
              )}
            </div>
            {animationMessageId && (
              <motion.div
                className="border border-transparent rounded-[16px] focus:outline-none px-3 pt-0.5 text-base md:text-sm w-full text-neutral-900 absolute inset-0 touch-none pointer-events-none whitespace-pre"
                layoutId={animationMessageId}
                style={{
                  height: textareaHeight,
                }}
                initial={{
                  // TODO: For some reason, opacity animations don't work when there are multiple rows.
                  opacity: textareaHeight === 52 ? 0 : 1,
                  x: 16,
                  y: 8,
                  backgroundColor: theme.isDarkMode ? "#171717" : "#fff",
                  color: theme.isDarkMode ? "#fff" : "#171717",
                }}
              >
                {message}
              </motion.div>
            )}
          </form>
        </div>
        <div
          className="grow overflow-y-auto overflow-x-hidden flex flex-col-reverse px-4 min-h-0 scroll-mb-[52px]"
          ref={scrollRef}
          onClick={() => textareaRef.current?.focus()}
        >
          <motion.div
            className="shrink-0 w-full cursor-text"
            ref={bottomRef ?? 52}
            style={{
              minHeight: textareaHeight + (isMobile ? 12 : 8),
            }}
            transition={{ duration: 0.075 }}
          ></motion.div>
          <div className={clsx("flex flex-col items-end justify-end grow")}>
            {messages?.map((message) => (
              <motion.div
                key={message.id}
                className={clsx(
                  "rounded-[16px] text-base md:text-sm px-2.5 min-w-[40px] flex justify-center py-1 mt-0.5 shrink-0 break-all max-w-lg whitespace-pre-wrap border border-transparent",
                  {
                    // TODO: make bg-gradient work with
                    // "bg-gradient": message.id !== animationMessageId,
                  }
                )}
                layoutId={String(message.id)}
                layout="position"
                onClick={(e) => e.stopPropagation()}
                initial={
                  animationMessageId
                    ? {
                        opacity: 0,
                        backgroundColor: theme.isDarkMode ? "#171717" : "#fff",
                        color: theme.isDarkMode ? "#fff" : "#171717",
                      }
                    : false
                }
                animate={{
                  opacity: 1,
                  minHeight: 28,
                  backgroundColor: "#0b93f6",
                  color: "#ffffff",
                }}
              >
                {message.data}
              </motion.div>
            ))}
          </div>
        </div>
      </LayoutGroup>
    </div>
  );
}

function NukeEverything() {
  const persistence = yjs.usePersistence();

  return (
    <button
      onClick={async () => {
        const confirmed = confirm("are you sure you want to nuke everything?");
        if (confirmed) {
          await persistence?.clearData();
          window.location.search = "";
          window.location.href = "/";
        }
      }}
      className="text-3xl"
      aria-label="Delete all data"
    >
      💥
    </button>
  );
}

function SideBar() {
  const mounted = useRef(false);
  const [notes, ynotes] = yjs.useArray<{
    id: string;
    createdAt: number;
    updatedAt: number;
    title: string;
  }>("notes");

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("id");

  useEffect(() => {
    if (!ynotes) return;
    if (
      !selectedId ||
      (notes && !notes.some((note) => note.id === selectedId))
    ) {
      const firstNote = notes?.[0];
      if (firstNote) {
        if (!mounted.current) {
          if (firstNote && firstNote.title === NEW_NOTE_TITLE) {
            setSearchParams({ id: firstNote.id });
          } else {
            const noteId = createNewNote(ynotes);
            setSearchParams({ id: noteId });
          }
        } else {
          setSearchParams({ id: firstNote.id });
        }
      } else {
        const noteId = createNewNote(ynotes);
        setSearchParams({ id: noteId });
      }
      mounted.current = true;
    }
  }, [selectedId, ynotes]);

  const [showHiddenOptions, setShowHiddenOptions] = useState(false);
  const theme = useTheme();

  function onContextMenu(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    setShowHiddenOptions(!showHiddenOptions);
  }

  function handleDeleteNote() {
    if (!confirm("Are you sure you want to delete this note?")) return;
    const noteIndex = notes?.findIndex((note) => note.id === selectedId);
    if (noteIndex !== undefined && ynotes) {
      ynotes.delete(noteIndex);
      const nextSelectedNote = notes?.[noteIndex + 1];
      if (nextSelectedNote) {
        setSearchParams({ id: nextSelectedNote.id });
      } else if (notes?.[noteIndex - 1]) {
        setSearchParams({ id: notes[noteIndex - 1].id });
      } else {
        setSearchParams({});
      }
    }
  }

  function handleCreateNote() {
    if (!ynotes) return;
    const noteId = createNewNote(ynotes);
    setSearchParams({ id: noteId });
  }

  return (
    <div
      style={{ minWidth: 300, maxWidth: 300 }}
      className="h-full border-l dark:border-neutral-800 snap-center flex flex-col w-full"
      onContextMenu={onContextMenu}
    >
      <ul className="overflow-y-auto overflow-x-hidden grow p-2">
        {notes?.map((note, i) => (
          <li key={note.id}>
            <button
              onClick={() => setSearchParams({ id: note.id })}
              className={clsx(
                "rounded-md cursor-default select-none px-5 py-2 w-full flex flex-col truncate",
                {
                  "bg-neutral-200 dark:bg-neutral-700": note.id === selectedId,
                }
              )}
            >
              <span className="font-semibold block text-sm text-neutral-900 dark:text-neutral-100">
                {note.title}
              </span>
              <span className="block text-xs mt-1 dark:text-neutral-400">
                <DateFormatter
                  value={new Date(note.updatedAt)}
                  options={{
                    timeStyle: "short",
                    dateStyle: isToday(note.updatedAt) ? undefined : "short",
                  }}
                />
              </span>
            </button>
            {i < notes.length - 1 && (
              <hr className="ml-5 mr-2 border-neutral-200 dark:border-neutral-700 -my-px" />
            )}
          </li>
        ))}
      </ul>
      <div className="w-full flex justify-center space-x-3 p-2">
        <button
          onClick={handleCreateNote}
          className="text-3xl"
          aria-label={NEW_NOTE_TITLE}
        >
          🆕
        </button>
        <button
          onClick={() => theme.toggle()}
          className="text-3xl"
          aria-label={NEW_NOTE_TITLE}
        >
          {theme.isDarkMode ? "🌞" : "🌙"}
        </button>
        {showHiddenOptions && <NukeEverything />}
        <div className="mr-0 ml-auto">
          <button
            onClick={handleDeleteNote}
            aria-label="Delete note"
            className="text-3xl"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }> {
  state: { error: Error | null; errorInfo: any };
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  componentDidCatch(error: any, errorInfo: any) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.errorInfo) {
      return (
        <div>
          <h2>Something went wrong.</h2>
          <NukeEverything />
          <details style={{ whiteSpace: "pre-wrap" }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return <>{this.props.children}</>;
  }
}

function App() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  return (
    <ErrorBoundary>
      <I18nProvider locale="en-US">
        <yjs.Provider
          roomName="hello"
          onSync={(ydoc) => {
            const ynotes = ydoc.getArray<{
              id: string;
              createdAt: number;
              updatedAt: number;
              title: string;
            }>("notes");
            if (ynotes.length === 0) {
              createNewNote(ynotes);
            }
          }}
        >
          <div className="h-screen flex overflow-x-auto snap-x snap-mandatory no-scrollbar dark:bg-neutral-900">
            {id ? <Texting id={id} /> : <div className="grow" />}
            <SideBar />
          </div>
        </yjs.Provider>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App;
