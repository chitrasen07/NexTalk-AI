"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
}

/** Lightweight accessible checkbox built on a native input (no extra deps). */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, label, id, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className="inline-flex cursor-pointer items-start gap-2 text-sm"
      >
        <span className="relative mt-0.5 inline-flex h-4 w-4 shrink-0">
          <input
            id={id}
            ref={ref}
            type="checkbox"
            checked={checked}
            className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-input bg-background transition-colors checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...props}
          />
          <Check
            className={cn(
              "pointer-events-none absolute left-0 top-0 h-4 w-4 text-primary-foreground opacity-0 peer-checked:opacity-100",
              className,
            )}
          />
        </span>
        {label ? <span className="leading-snug">{label}</span> : null}
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
