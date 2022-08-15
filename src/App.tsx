import { v4 as uuid } from "@lukeed/uuid";
import clsx from "clsx";
import { LayoutGroup, motion, useScroll } from "framer-motion";
import { FormEvent, useEffect, useRef, useState } from "react";
import { I18nProvider, useDateFormatter } from "react-aria";
import { flushSync } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as Y from "yjs";
import { yjs } from "./lib/yjs";

function createNewNote(
  ynotes: Y.Array<{
    id: string;
    createdAt: number;
    title: string;
  }>
) {
  const _id = uuid();
  ynotes.push([{ id: _id, createdAt: Date.now(), title: "New Note" }]);
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
    title: string;
  }>("notes");
  const [message, setMessage] = useState("");
  const [animationMessageId, setAnimationMessageId] = useState<string | null>();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { scrollY } = useScroll({
    container: scrollRef,
  });
  const transact = yjs.useTransact();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ymessages || !message) {
      return;
    }

    if (!messageMeta?.title) {
      // transact(() => {
      //   const messageIndex = messages?.findIndex(
      //     (message) => message.id === messageId
      //   );
      //   // TODO: useMap types are bad :(
      //   ymessageMeta?.set("title", message as any);
      // });
    }

    const showAnimation = scrollY.get() > -100;
    const messageId = uuid();
    showAnimation && setAnimationMessageId(messageId);
    setTimeout(() => {
      ymessages.push([{ data: message, id: messageId }]);
      showAnimation && setAnimationMessageId(null);
      flushSync(() => {
        setMessage("");
      });
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      });
      // scrollRef.current?.scrollBy({
      //   behavior: "smooth",
      //   top: scrollRef.current.scrollHeight,
      // });
    });
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, [props.id]);

  return (
    <div className="flex flex-col-reverse h-full grow relative min-w-screen md:min-w-0 snap-center">
      {/* <button onClick={() => ymessages?.delete(0, messages?.length)}>
          💥
        </button> */}
      {typeof messages !== "undefined" && (
        <div
          className={clsx(
            "inset-0 absolute grid place-content-center text-neutral-700 font-bold transition-opacity",
            {
              "opacity-100": messages.length === 0,
              "opacity-0 pointer-events-none touch-none": messages.length > 0,
            }
          )}
          aria-hidden={messages.length > 0}
          onClick={() => inputRef.current?.focus()}
        >
          Start writing 👇
        </div>
      )}

      <LayoutGroup>
        <div className="px-4 pb-4 pt-2 inset-x-0 absolute bg-white/50 backdrop-blur-lg">
          <form
            onSubmit={onSubmit}
            className="flex"
            onClick={() => inputRef.current?.focus()}
          >
            <input
              type="text"
              name="message"
              className="border border-neutral-300 rounded-[20px] focus:outline-none px-3 text-base md:text-sm py-0.5 w-full text-neutral-900"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              ref={inputRef}
            />
            {animationMessageId && (
              <motion.div
                className="border border-transparent rounded-[20px] focus:outline-none px-3 text-base md:text-sm py-0.5 w-full text-neutral-900 min-h-[25.5px] absolute inset-0 touch-none pointer-events-none whitespace-pre"
                layoutId={animationMessageId}
                initial={{ opacity: 0 }}
              >
                {message}
              </motion.div>
            )}
          </form>
        </div>
        <div
          className="grow overflow-y-auto overflow-x-hidden flex flex-col-reverse px-4 min-h-0"
          ref={scrollRef}
        >
          <div className={clsx("flex flex-col items-end justify-end grow")}>
            {messages?.map((message) => (
              <motion.div
                key={message.id}
                className={clsx(
                  "rounded-[20px] text-base md:text-sm px-2.5 min-h-[28px] min-w-[40px] flex justify-center py-1 mt-0.5 shrink-0 break-all max-w-lg whitespace-pre-wrap border border-transparent",
                  {
                    "bg-gradient": message.id !== animationMessageId,
                  }
                )}
                layoutId={String(message.id)}
                layout="position"
                initial={
                  animationMessageId
                    ? {
                        opacity: 0,
                        // backgroundColor: animationMessageId
                        //   ? "#ffffff"
                        //   : "#0b93f6",
                        color: animationMessageId ? "rgb(23 23 23)" : "#ffffff",
                      }
                    : false
                }
                animate={{
                  opacity: 1,
                  // backgroundColor: "#0b93f6",
                  color: "#ffffff",
                }}
              >
                {message.data}
              </motion.div>
            ))}
            <div
              className="shrink-0 w-full cursor-text min-h-[58px] md:min-h-[52px]"
              ref={bottomRef}
              onClick={() => inputRef.current?.focus()}
            ></div>
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
    if (!selectedId) {
      const firstNote = notes?.[0];
      if (firstNote) {
        if (!mounted) {
          if (firstNote && firstNote.title === "New Note") {
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
  const navigate = useNavigate();

  function onContextMenu(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    setShowHiddenOptions(!showHiddenOptions);
  }

  return (
    <div
      style={{ minWidth: 300 }}
      className="h-full border-l p-2 snap-center flex flex-col"
      onContextMenu={onContextMenu}
    >
      <ul className="overflow-y-auto grow">
        {notes?.map((note, i) => (
          <li key={note.id}>
            <button
              onClick={() => setSearchParams({ id: note.id })}
              className={clsx(
                "rounded-lg cursor-default select-none px-5 py-2 w-full flex flex-col",
                {
                  "bg-neutral-200": note.id === selectedId,
                }
              )}
            >
              <span className="font-semibold block text-sm text-neutral-900">
                {note.title}
              </span>
              <span className="block text-xs mt-1">
                {formatter.format(new Date(note.createdAt))}
              </span>
            </button>
            {i < notes.length - 1 && (
              <hr className="ml-5 mr-2 text-neutral-200 -my-px" />
            )}
          </li>
        ))}
      </ul>
      <div className="w-full flex justify-center space-x-3">
        <button
          onClick={() => {
            const _id = uuid();
            ynotes?.push([
              { id: _id, createdAt: Date.now(), title: "New Note" },
            ]);
            setSearchParams({ id: _id });
          }}
          className="text-3xl"
          aria-label="New note"
        >
          🆕
        </button>
        {showHiddenOptions && (
          <button
            onClick={async () => {
              if (confirm("are you sure you want to nuke everything?")) {
                console.log("nukin");
                persistence?.clearData();
                navigate("/");
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
            title: string;
          }>("notes");
          if (ynotes.length === 0) {
            createNewNote(ynotes);
          }
        }}
      >
        <div className="h-screen flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
          {id && <Texting id={id} />}
          <SideBar />
        </div>
      </yjs.Provider>
    </I18nProvider>
  );
}

export default App;
