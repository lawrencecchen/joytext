import clsx, { ClassValue } from "clsx";
import { DateFormatterOptions, useDateFormatter } from "react-aria";
export default function DateFormatter(props: {
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
