import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
import z, { ZodType } from "zod";

const YMap = z.object({
  _ytype: z.literal("map"),
});
const YArray = z.object({
  _ytype: z.literal("array"),
});
const YText = z.object({
  _ytype: z.literal("text"),
});
// const YDataTypeUnion = z.union([YMap, YArray, YText]);
// type YDataTypeUnionType = z.infer<typeof YDataTypeUnion>;
const YSchemaOpts = z.record(z.string(), z.union([YMap, YArray, YText]));
type YSchemaOptsType = z.infer<typeof YSchemaOpts>;
const YSchema = z.object({
  _opts: YSchemaOpts,
  _ytype: z.literal("schema"),
});
type YSchemaType = z.infer<typeof YSchema>;

export function initY() {
  function _schema(opts: YSchemaOptsType) {
    return { _ytype: "schema" as const, _opts: opts };
  }
  function _map<T extends string>(opts: Record<T, ZodType>) {
    return { _ytype: "map" as const, _opts: opts };
  }
  function _array() {
    return { _ytype: "array" as const };
  }
  function _text() {
    return { _ytype: "text" as const };
  }
  function _xmlFragment() {
    throw new Error("not implemented");
  }
  function _xmlElement() {
    throw new Error("not implemented");
  }
  function _xmlText() {
    throw new Error("not implemented");
  }

  return {
    schema: _schema,
    map: _map,
    array: _array,
    text: _text,
    xmlFragment: _xmlFragment,
    xmlElement: _xmlElement,
    xmlText: _xmlText,
  };
}
const y = initY();
const schema = y.schema({
  rooms: y.map({
    roomName: z.string(),
  }),
});

type Persistence = IndexeddbPersistence;
function createYjs(opts?: {
  persistence?: (opts: { roomName: string; ydoc: Y.Doc }) => Persistence;
  schema: YSchemaType;
}) {
  const yjsContext = createContext<{
    ydoc?: Y.Doc;
    persistence?: IndexeddbPersistence;
  } | null>(null);
  if (!opts?.schema) {
    throw new Error("missing schema");
  }
  type SchemaKey = keyof typeof opts.schema._opts;
  type SchemaValue = {
    _ytype: "map" | "array" | "text";
    _key: SchemaKey;
  };
  const _schema = {} as {
    [key: SchemaKey]: SchemaValue;
  };
  for (const [key, value] of Object.entries(opts.schema._opts)) {
    _schema[key] = { _ytype: value._ytype, _key: key };
  }
  type Schema = typeof _schema;

  function Provider(props: {
    children: React.ReactNode;
    roomName: string;
    onSync?: (ydoc: Y.Doc) => void;
  }) {
    const [ydoc, setYDoc] = useState<Y.Doc>();
    const [persistence, setPersistence] = useState<Persistence>();
    const [synced, setSynced] = useState(false);

    useEffect(() => {
      const _doc = new Y.Doc();
      const _persistence = opts?.persistence?.({
        roomName: props.roomName,
        ydoc: _doc,
      });
      setYDoc(_doc);
      setPersistence(_persistence);
      _persistence?.once("synced", () => {
        // console.log("initial content loaded");
        props.onSync?.(_doc);
        setSynced(true);
      });
      return () => {
        _doc.destroy();
        _persistence?.destroy();
      };
    }, [props.roomName]);

    return (
      <yjsContext.Provider value={{ ydoc, persistence }}>
        {synced && props.children}
      </yjsContext.Provider>
    );
  }

  function _useState() {
    //
  }

  // type SelectorObj = { [key in Key]: void };
  function useCrdt<Key extends keyof Schema>(
    // function useCrdt<Key extends string & keyof Schema>(
    opts?: (selector: { [key in Key]: void }) => any
  ) {
    const context = useContext(yjsContext);
    if (!context) {
      throw new Error("useCrdt must be used within a yjs context");
    }
    const { ydoc } = context;
    console.log(_schema);
  }

  type ObservedType<T extends Y.Array<any> | Y.Text | Y.Map<any>> =
    T extends Y.Array<infer U>
      ? U[]
      : T extends Y.Text
      ? string
      : T extends Y.Map<infer U>
      ? U
      : never;

  function useObserved<T extends Y.Array<any> | Y.Text | Y.Map<any>>(
    path: string,
    getYDataType: (ydoc: Y.Doc, path: string) => T
  ) {
    const context = useContext(yjsContext);
    if (!context) {
      throw new Error("useObserved must be used within a yjs context");
    }
    const [observedValue, setObservedValue] = useState<ObservedType<T>>();
    const [yDataType, setYDataType] = useState<T>();

    const onObserve = useCallback(() => {
      setObservedValue(yDataType?.toJSON() as any);
    }, [yDataType]);

    useEffect(() => {
      if (!context.ydoc || !path) {
        return;
      }
      const _yDataType = getYDataType(context.ydoc, path);
      setYDataType(_yDataType as any);
      setObservedValue(_yDataType?.toJSON() as any);
      _yDataType.observe(onObserve);
      return () => {
        _yDataType.unobserve(onObserve);
      };
    }, [context.ydoc, context.persistence?.synced, path, onObserve]);

    return [observedValue, yDataType] as const;
  }

  function useArray<T>(path: string) {
    return useObserved<Y.Array<T>>(path, (ydoc, path) => ydoc.getArray(path));
  }
  function useMap<T>(path: string) {
    return useObserved<Y.Map<T>>(path, (ydoc, path) => ydoc.getMap(path));
  }
  function useText(path: string) {
    return useObserved<Y.Text>(path, (ydoc, path) => ydoc.getText(path));
  }
  function useYDoc() {
    const context = useContext(yjsContext);
    if (!context) {
      throw new Error("useYDoc must be used within a yjs context");
    }
    return context.ydoc;
  }
  function useTransact() {
    const context = useContext(yjsContext);
    if (!context) {
      throw new Error("useTransact must be used within a yjs context");
    }
    if (!context.ydoc) {
      throw new Error("useTransact(): ydoc not initialized yet");
    }
    return context.ydoc.transact;
  }
  function usePersistence() {
    const context = useContext(yjsContext);
    if (!context) {
      throw new Error("usePersistence must be used within a yjs context");
    }
    return context.persistence;
  }

  function useShared<T extends Y.Array<any> | Y.Text | Y.Map<any>>(
    props: (ydoc: Y.Doc) => T
  ) {
    const context = useContext(yjsContext);
    if (!context) {
      throw new Error("useYDoc must be used within a yjs context");
    }
    const [observedValue, setObservedValue] = useState<ObservedType<T>>();
    const [yDataType, setYDataType] = useState<T>();

    function onObserve() {
      setObservedValue(yDataType?.toJSON() as ObservedType<T>);
    }

    useEffect(() => {
      onObserve();
    }, []);

    useEffect(() => {
      if (!context.ydoc) {
        return;
      }
      const _yDataType = props(context.ydoc);
      setYDataType(_yDataType);

      _yDataType.observe(onObserve);

      return () => {
        _yDataType.unobserve(onObserve);
        // setObservedValue(undefined);
        // setYDataType(undefined);
      };
    }, [context.ydoc, props, onObserve]);

    return [observedValue, yDataType] as const;
  }

  return {
    Provider,
    useState: _useState,
    useCrdt,
    useShared,
    useArray,
    useMap,
    useText,
    useYDoc,
    usePersistence,
    useTransact,
  };
}

export const yjs = createYjs({
  persistence: ({ roomName, ydoc }) => new IndexeddbPersistence(roomName, ydoc),
  schema,
});
