import { v4 as uuid } from "@lukeed/uuid";
import clsx, { ClassValue } from "clsx";
import { isToday } from "date-fns";
import { LayoutGroup, motion, useScroll } from "framer-motion";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  DateFormatterOptions,
  I18nProvider,
  useDateFormatter,
} from "react-aria";
import { flushSync } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { useElementSize } from "usehooks-ts";
import * as Y from "yjs";
import AutosizeTextarea from "./components/AutosizeTextarea";
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

function DateFormatter(props: {
  value?: Date | null;
  options?: DateFormatterOptions;
  className?: ClassValue;
}) {
  const formatter = useDateFormatter(props.options);
  if (!props.value) {
    return <>-</>;
  }
  return (
    <time className={clsx("whitespace-nowrap", props.className)}>
      {formatter.format(props.value)}
    </time>
  );
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
  const textareaWrapper = useRef<HTMLDivElement | null>(null);
  const { scrollY } = useScroll({
    container: scrollRef,
  });
  const ydoc = yjs.useYDoc();
  const [textareaKey, setTextareaKey] = useState(0);
  const [textareaWrapperMeasurerRef, { height: textareaHeight }] =
    useElementSize<HTMLDivElement>();

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
            <div className="border border-neutral-300 dark:border-neutral-700 rounded-[16px] px-3 pt-0.5 pb-1 w-full flex backdrop-blur-3xl">
              <AutosizeTextarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="focus:outline-none text-base md:text-sm grow w-full dark:text-white text-neutral-900 bg-transparent"
                rows={1}
                key={textareaKey}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    onSubmit(e);
                  }
                }}
                // onResize={(el) => {
                //   if (textareaWrapper.current) {
                //     setTextareaWrapperHeight(el.offsetHeight);
                //   }
                // }}
                ref={textareaRef}
              />
            </div>
            {animationMessageId && (
              <motion.div
                className="border border-transparent rounded-[16px] transform translate-x-[16px] translate-y-[8px] focus:outline-none px-3 pt-0.5 pb-1 text-base md:text-sm w-full text-neutral-900 min-h-[24px] absolute inset-0 touch-none pointer-events-none whitespace-pre"
                layoutId={animationMessageId}
                initial={{ opacity: 0.1 }}
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
              minHeight: textareaHeight + 16,
            }}
            transition={{ duration: 0.075 }}
          ></motion.div>
          <div className={clsx("flex flex-col items-end justify-end grow")}>
            {messages?.map((message) => (
              <motion.div
                key={message.id}
                className={clsx(
                  "rounded-[16px] text-base md:text-sm px-2.5 min-h-[28px] min-w-[40px] flex justify-center py-1 mt-0.5 shrink-0 break-all max-w-lg whitespace-pre-wrap border border-transparent",
                  {
                    // todo: make bg-gradient work with
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
                        backgroundColor: animationMessageId
                          ? "#ffffff"
                          : "#0b93f6",
                        color: animationMessageId ? "rgb(23 23 23)" : "#ffffff",
                      }
                    : false
                }
                animate={{
                  opacity: 1,
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

function SideBar() {
  const [mounted, setMounted] = useState(false);
  const [notes, ynotes] = yjs.useArray<{
    id: string;
    createdAt: number;
    updatedAt: number;
    title: string;
  }>("notes");

  const formatter = useDateFormatter({
    timeStyle: "short",
    dateStyle: "short",
  });

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
        if (!mounted) {
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
        throw new Error(
          "no notes, this should never happen unless the persistence sync failed"
        );
      }
    }
  }, [selectedId, ynotes, mounted]);

  const persistence = yjs.usePersistence();
  const [showHiddenOptions, setShowHiddenOptions] = useState(false);
  const theme = useTheme();

  function onContextMenu(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    setShowHiddenOptions(!showHiddenOptions);
  }

  return (
    <div
      style={{ minWidth: 300 }}
      className="h-full border-l dark:border-neutral-800 p-2 snap-center flex flex-col"
      onContextMenu={onContextMenu}
    >
      <ul className="overflow-y-auto grow">
        {notes?.map((note, i) => (
          <li key={note.id}>
            <button
              onClick={() => setSearchParams({ id: note.id })}
              className={clsx(
                "rounded-md cursor-default select-none px-5 py-2 w-full flex flex-col",
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
                {/* {isToday(note.updatedAt) ? (
                  <DateFormatter
                    value={new Date(note.updatedAt)}
                    options={{
                      timeStyle: "short",
                      dateStyle: "short",
                    }}
                  />
                ) : (
                  <DateFormatter
                    value={new Date(note.updatedAt)}
                    options={{
                      timeStyle: "short",
                      dateStyle: "short",
                    }}
                  />
                )} */}
                {/* {isToday(note.createdAt) ? formatter.format(new Date(note.updatedAt)) : formatter.format(new Date(note.updatedAt))} */}
                {/* {formatter.format(new Date(note.updatedAt))} */}
              </span>
            </button>
            {i < notes.length - 1 && (
              <hr className="ml-5 mr-2 border-neutral-200 dark:border-neutral-700 -my-px" />
            )}
          </li>
        ))}
      </ul>
      <div className="w-full flex justify-center space-x-3">
        <button
          onClick={() => {
            if (!ynotes) return;
            const noteId = createNewNote(ynotes);
            setSearchParams({ id: noteId });
          }}
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
        {showHiddenOptions && (
          <button
            onClick={async () => {
              if (confirm("are you sure you want to nuke everything?")) {
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
        )}
      </div>
    </div>
  );
}

function App() {
  // const [id, setId] = useState("123");
  const [searchParams, setSearchParams] = useSearchParams();
  const id = searchParams.get("id");

  return (
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
          {id && <Texting id={id} />}
          <SideBar />
        </div>
      </yjs.Provider>
    </I18nProvider>
  );
}

export default App;
