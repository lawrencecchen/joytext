import autosize from "autosize";
import { forwardRef, useEffect, useRef } from "react";

const AutosizeTextarea = forwardRef<
  HTMLTextAreaElement,
  React.DetailedHTMLProps<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  > & {
    onResize?: (target: HTMLTextAreaElement) => void;
  }
>((props, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    function onResize() {
      if (textareaRef.current && props.onResize) {
        props.onResize(textareaRef.current);
      }
    }
    const target = textareaRef.current;
    if (target) {
      autosize(target);
      target.addEventListener("autosize:resized", onResize);
      return () => {
        autosize.destroy(target);
        target.removeEventListener("autosize:resized", onResize);
      };
    }
  }, []);

  return (
    <textarea
      {...props}
      ref={(node) => {
        textareaRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
    />
  );
});
export default AutosizeTextarea;
