import { type SelectHTMLAttributes } from "react";
import clsx from "clsx";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, className, id, name, children, ...rest }: SelectProps) {
  const reactId = id || name;
  return (
    <label htmlFor={reactId} className="block">
      {label && <span className="block mb-1 text-xs font-medium text-ink-600">{label}</span>}
      <select id={reactId} name={name} className={clsx("es-input", className)} {...rest}>
        {children}
      </select>
    </label>
  );
}
