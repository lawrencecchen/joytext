import { v4 as uuid } from "@lukeed/uuid";
import clsx from "clsx";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { FormEvent, useEffect, useRef, useState } from "react";
import { I18nProvider, useDateFormatter } from "react-aria";
import { flushSync } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import { yjs } from "./lib/yjs";

function Texting(props: { id: string }) {
  const [messages, ymessages] = yjs.useArray<{ data: string; id: string }>(
    `messages.${props.id}`
  );
  // const [notes, ynotes] = yjs.useArray<{
  //   id: string;
  //   createdAt: number;
  //   title: string;
  // }>("notes");
  const [message, setMessage] = useState("");
  const reversedMessages = messages && [...messages].reverse();
  const [id, setId] = useState<string | null>();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function onSubmit(e: FormEvent) {
    if (!ymessages) {
      return;
    }
    e.preventDefault();
    const _id = uuid();
    setId(_id);
    setTimeout(() => {
      setId(null);
      ymessages.push([{ data: message, id: _id }]);
      flushSync(() => {
        setMessage("");
      });
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
      scrollRef.current?.scrollBy({
        behavior: "smooth",
        top: scrollRef.current.scrollHeight,
      });
    });
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, [props.id]);

  return (
    <div
      className="flex flex-col-reverse h-full grow relative min-w-screen md:min-w-0"
      onClick={() => inputRef.current?.focus()}
    >
      {/* <button onClick={() => ymessages?.delete(0, messages?.length)}>
          💥
        </button> */}
      {/* {typeof messages !== "undefined" && (
        <div
          className={clsx(
            "inset-0 absolute grid place-content-center text-neutral-700 font-bold transition-opacity pointer-events-none touch-none -z-50",
            {
              "opacity-100": messages.length === 0,
              "opacity-0": messages.length > 0,
            }
          )}
          aria-hidden={messages.length > 0}
        >
          Start writing 👇
        </div>
      )} */}

      <LayoutGroup>
        <div className="px-4 pb-4 pt-2 inset-x-0 absolute bg-white/50 backdrop-blur-lg">
          <form onSubmit={onSubmit} className="flex">
            <input
              type="text"
              name="message"
              className="border border-neutral-300 rounded-[20px] focus:outline-none px-3 text-[13px] py-0.5 w-full font-medium text-neutral-900"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              ref={inputRef}
            />
            {id && (
              <motion.div
                className="border border-transparent rounded-[20px] focus:outline-none px-3 text-[13px] py-0.5 w-full font-medium text-neutral-900 min-h-[25.5px] absolute inset-0 touch-none pointer-events-none whitespace-pre z-50"
                layoutId={id}
                initial={{ opacity: 0 }}
              >
                {message}
              </motion.div>
            )}
          </form>
        </div>
        <motion.div
          className="grow flex flex-col-reverse items-end overflow-auto min-h-0 px-4 z-0"
          ref={scrollRef}
        >
          <div
            className="shrink-0 w-full"
            ref={bottomRef}
            style={{ minHeight: 56 }}
          ></div>
          {reversedMessages?.map((message, index) => (
            <motion.div
              key={message.id}
              className="rounded-[20px] bg-gradient-to-br font-medium text-[13px] px-2.5 min-h-[28px] py-1 mt-0.5 shrink-0 break-words max-w-full whitespace-pre-wrap border border-transparent z-50"
              layoutId={String(message.id)}
              layout="position"
              initial={
                id
                  ? {
                      opacity: 0,
                      backgroundColor: id ? "#ffffff" : "#0b93f6",
                      color: id ? "rgb(23 23 23)" : "#ffffff",
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
        </motion.div>
      </LayoutGroup>
    </div>
  );
}

function SideBar(props: { selectedId: string | null }) {
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

  return (
    <div style={{ minWidth: 300 }} className="h-full border-r p-2">
      <div className="w-full flex justify-end space-x-3">
        <button
          onClick={() => ynotes?.delete(0, notes?.length)}
          className="text-2xl"
        >
          💥
        </button>
        <button
          onClick={() => {
            const _id = uuid();
            ynotes?.push([
              { id: _id, createdAt: Date.now(), title: "New Note" },
            ]);
            setSearchParams({ id: _id });
          }}
          className="text-2xl"
        >
          🆕
        </button>
      </div>
      <ul>
        {notes?.map((note, i) => (
          <li key={note.id}>
            <button
              onClick={() => setSearchParams({ id: note.id })}
              className={clsx(
                "rounded-lg cursor-default select-none px-5 py-2 w-full flex flex-col",
                {
                  "bg-neutral-200": note.id === props.selectedId,
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
    </div>
  );
}

function App() {
  // const [id, setId] = useState("123");
  const [searchParams, setSearchParams] = useSearchParams();
  const id = searchParams.get("id");

  return (
    <div className="h-screen flex overflow-x-auto">
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
              const _id = uuid();
              ynotes.push([
                { id: _id, createdAt: Date.now(), title: "New Note" },
              ]);
            }
          }}
        >
          {id && <Texting id={id} />}
          <SideBar selectedId={id} />
        </yjs.Provider>
      </I18nProvider>
    </div>
  );
}

export default App;
