"use client";

import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/utils";
import { useLanguage } from "../providers/LanguageProvider";

/**
 * Ledger-baseline field for the auth screens.
 * No box border, no resting shadow: a cream-50 well distinguished from the
 * cream-100 page by fill-tone plus a single 1px cream-300 bottom rule that
 * animates to a 2px bronze baseline on focus (scaleX, origin-left).
 */

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
  actionRight?: ReactNode;
};

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  function AuthField(
    { label, hint, error, actionRight, className, id: providedId, type, ...rest },
    ref
  ) {
    const { locale } = useLanguage();
    const reactId = useId();
    const id = providedId ?? `af-${reactId}`;
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;
    const hasError = Boolean(error);
    const describedBy = hint || error ? `${id}-msg` : undefined;

    return (
      <div className="relative">
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={inputType}
            placeholder=" "
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
            className={cn(
              // peer + de-chromed well; padding leaves room for the floating label
              "peer block w-full rounded-t-[12px] border-0 bg-cream-50/90 px-4 pb-2.5 pt-6 text-[16px] text-ink-900",
              "placeholder:text-transparent outline-none transition-colors duration-200",
              "focus:bg-cream-50",
              (isPassword || actionRight) && "pr-12",
              className
            )}
            {...rest}
          />

          {/* Resting baseline (always present = affordance) */}
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-px",
              hasError ? "bg-danger/50" : "bg-cream-300"
            )}
          />
          {/* Focus baseline: 2px, drawn from the left on focus */}
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 ease-smooth peer-focus:scale-x-100",
              hasError ? "bg-danger" : "bg-brand-700"
            )}
          />

          <label
            htmlFor={id}
            className={cn(
              "pointer-events-none absolute left-4 top-1/2 origin-[0_0] -translate-y-1/2 text-[0.95rem] font-medium text-ink-500 transition-all duration-200 ease-smooth",
              "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100",
              "peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:scale-[0.78] peer-focus:text-ink-700",
              "peer-[&:not(:placeholder-shown)]:top-2.5 peer-[&:not(:placeholder-shown)]:translate-y-0 peer-[&:not(:placeholder-shown)]:scale-[0.78] peer-[&:not(:placeholder-shown)]:text-ink-700"
            )}
          >
            {label}
          </label>

          {isPassword ? (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-500 outline-none transition-colors hover:text-ink-700 focus-visible:ring-2 focus-visible:ring-brand-400"
              aria-label={
                showPassword
                  ? locale === "id"
                    ? "Sembunyikan password"
                    : "Hide password"
                  : locale === "id"
                    ? "Tampilkan password"
                    : "Show password"
              }
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          ) : actionRight ? (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">{actionRight}</div>
          ) : null}
        </div>

        {(hint || error) && (
          <p
            id={`${id}-msg`}
            className={cn(
              "mt-1.5 text-[0.8rem] leading-relaxed",
              hasError ? "text-danger" : "text-ink-500"
            )}
            role={hasError ? "alert" : undefined}
          >
            {error ?? hint}
          </p>
        )}
      </div>
    );
  }
);
