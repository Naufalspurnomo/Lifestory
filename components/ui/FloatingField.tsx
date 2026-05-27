"use client";

import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "../../lib/utils";

/**
 * FloatingField primitives — input, textarea, select with floating label.
 * Designed to share a single visual rhythm with Tailwind tokens.
 *
 * Pattern: label uses `peer-*` modifiers tied to focus/placeholder-shown state.
 * The placeholder MUST be `" "` (a single space) so `:placeholder-shown` works.
 */

type BaseSlots = {
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  containerClassName?: string;
};

const baseField =
  "peer block w-full rounded-card border bg-white px-4 pb-2.5 pt-5 text-[15px] text-ink-800 placeholder:text-transparent outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200/70 disabled:bg-cream-100 disabled:text-ink-300";

const fieldOk = "border-cream-300";
const fieldErr = "border-danger/60 focus:border-danger focus:ring-danger/15";

const labelBase =
  "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 origin-[0_0] text-[15px] font-medium text-ink-300 transition-all duration-200 ease-smooth peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:scale-[0.75] peer-focus:text-brand-700 peer-[&:not(:placeholder-shown)]:top-2.5 peer-[&:not(:placeholder-shown)]:translate-y-0 peer-[&:not(:placeholder-shown)]:scale-[0.75] peer-[&:not(:placeholder-shown)]:text-brand-700";

function FieldShell({
  id,
  label,
  hint,
  error,
  iconLeft,
  iconRight,
  fullWidth,
  containerClassName,
  children,
  hasPaddingLeft,
}: BaseSlots & {
  id: string;
  children: ReactNode;
  hasPaddingLeft: boolean;
  hasPaddingRight?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative",
        fullWidth ? "w-full" : "",
        containerClassName
      )}
    >
      <div className="relative">
        {iconLeft && (
          <span
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 inline-flex -translate-y-1/2 text-ink-300 [&>svg]:h-4 [&>svg]:w-4"
          >
            {iconLeft}
          </span>
        )}
        {children}
        <label
          htmlFor={id}
          className={cn(
            labelBase,
            hasPaddingLeft && "left-10 peer-placeholder-shown:left-10 peer-focus:left-10 peer-[&:not(:placeholder-shown)]:left-10"
          )}
        >
          {label}
        </label>
        {iconRight && (
          <span
            aria-hidden
            className="pointer-events-none absolute right-3.5 top-1/2 inline-flex -translate-y-1/2 text-ink-300 [&>svg]:h-4 [&>svg]:w-4"
          >
            {iconRight}
          </span>
        )}
      </div>
      {(hint || error) && (
        <p
          id={`${id}-hint`}
          className={cn(
            "mt-1.5 text-xs leading-relaxed",
            error ? "text-danger" : "text-ink-300"
          )}
          role={error ? "alert" : undefined}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

// =============================================================
// FloatingInput
// =============================================================
type InputProps = InputHTMLAttributes<HTMLInputElement> & BaseSlots;

export const FloatingInput = forwardRef<HTMLInputElement, InputProps>(
  function FloatingInput(
    {
      label,
      hint,
      error,
      iconLeft,
      iconRight,
      fullWidth = true,
      containerClassName,
      className,
      id: providedId,
      ...rest
    },
    ref
  ) {
    const reactId = useId();
    const id = providedId ?? `f-${reactId}`;

    return (
      <FieldShell
        id={id}
        label={label}
        hint={hint}
        error={error}
        iconLeft={iconLeft}
        iconRight={iconRight}
        fullWidth={fullWidth}
        containerClassName={containerClassName}
        hasPaddingLeft={Boolean(iconLeft)}
        hasPaddingRight={Boolean(iconRight)}
      >
        <input
          ref={ref}
          id={id}
          placeholder=" "
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={hint || error ? `${id}-hint` : undefined}
          className={cn(
            baseField,
            error ? fieldErr : fieldOk,
            iconLeft && "pl-10",
            iconRight && "pr-10",
            className
          )}
          {...rest}
        />
      </FieldShell>
    );
  }
);

// =============================================================
// FloatingTextarea
// =============================================================
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & BaseSlots;

export const FloatingTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function FloatingTextarea(
    {
      label,
      hint,
      error,
      fullWidth = true,
      containerClassName,
      className,
      id: providedId,
      rows = 5,
      ...rest
    },
    ref
  ) {
    const reactId = useId();
    const id = providedId ?? `f-${reactId}`;

    return (
      <div
        className={cn(
          "relative",
          fullWidth ? "w-full" : "",
          containerClassName
        )}
      >
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          placeholder=" "
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={hint || error ? `${id}-hint` : undefined}
          className={cn(
            "peer block w-full resize-none rounded-card border bg-white px-4 pb-3 pt-6 text-[15px] leading-relaxed text-ink-800 placeholder:text-transparent outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200/70",
            error ? fieldErr : fieldOk,
            className
          )}
          {...rest}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-4 top-5 origin-[0_0] text-[15px] font-medium text-ink-300 transition-all duration-200 ease-smooth peer-placeholder-shown:top-5 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:scale-[0.78] peer-focus:text-brand-700 peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:scale-[0.78] peer-[&:not(:placeholder-shown)]:text-brand-700"
        >
          {label}
        </label>
        {(hint || error) && (
          <p
            id={`${id}-hint`}
            className={cn(
              "mt-1.5 text-xs leading-relaxed",
              error ? "text-danger" : "text-ink-300"
            )}
            role={error ? "alert" : undefined}
          >
            {error ?? hint}
          </p>
        )}
      </div>
    );
  }
);

// =============================================================
// FloatingSelect
// =============================================================
type SelectProps = SelectHTMLAttributes<HTMLSelectElement> &
  BaseSlots & {
    options: Array<{ value: string; label: string }>;
  };

export const FloatingSelect = forwardRef<HTMLSelectElement, SelectProps>(
  function FloatingSelect(
    {
      label,
      hint,
      error,
      iconLeft,
      iconRight,
      fullWidth = true,
      containerClassName,
      className,
      id: providedId,
      options,
      ...rest
    },
    ref
  ) {
    const reactId = useId();
    const id = providedId ?? `f-${reactId}`;
    const [hasValue, setHasValue] = useState(
      Boolean(rest.value || rest.defaultValue)
    );

    return (
      <FieldShell
        id={id}
        label={label}
        hint={hint}
        error={error}
        iconLeft={iconLeft}
        iconRight={iconRight}
        fullWidth={fullWidth}
        containerClassName={containerClassName}
        hasPaddingLeft={Boolean(iconLeft)}
        hasPaddingRight
      >
        <select
          ref={ref}
          id={id}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={hint || error ? `${id}-hint` : undefined}
          onChange={(e) => {
            setHasValue(Boolean(e.target.value));
            rest.onChange?.(e);
          }}
          className={cn(
            "peer block w-full appearance-none rounded-card border bg-white px-4 pb-2.5 pt-5 text-[15px] text-ink-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200/70",
            error ? fieldErr : fieldOk,
            iconLeft && "pl-10",
            "pr-10",
            !hasValue && "text-ink-300",
            className
          )}
          {...rest}
        >
          <option value="" disabled hidden>
            {" "}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-300"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 5.5L7 9.5L11 5.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </FieldShell>
    );
  }
);
