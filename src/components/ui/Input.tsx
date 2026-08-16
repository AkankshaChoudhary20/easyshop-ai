import { type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, name, ...rest }: InputProps) {
  const reactId = id || name;
  return (
    <label htmlFor={reactId} className="block">
      {label && <span className="block mb-1 text-xs font-medium text-ink-600">{label}</span>}
      <input id={reactId} name={name} className={clsx("es-input", error && "border-danger", className)} {...rest} />
      {error && <span className="block mt-1 text-xs text-danger">{error}</span>}
    </label>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, name, ...rest }: TextareaProps) {
  const reactId = id || name;
  return (
    <label htmlFor={reactId} className="block">
      {label && <span className="block mb-1 text-xs font-medium text-ink-600">{label}</span>}
      <textarea
        id={reactId}
        name={name}
        className={clsx("es-input h-auto py-2 resize-y", error && "border-danger", className)}
        {...rest}
      />
      {error && <span className="block mt-1 text-xs text-danger">{error}</span>}
    </label>
  );
}
