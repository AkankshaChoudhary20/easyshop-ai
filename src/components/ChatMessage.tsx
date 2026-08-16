import clsx from "clsx";

export function ChatMessage({ role, content }: { role: "user" | "assistant"; content: string }) {
  return (
    <div className={clsx("flex", role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
          role === "user" ? "bg-brand text-white" : "bg-ink-50 text-ink-950",
        )}
      >
        {content}
      </div>
    </div>
  );
}
