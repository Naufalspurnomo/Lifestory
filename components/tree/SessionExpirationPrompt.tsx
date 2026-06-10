"use client";

import { useCallback, useState } from "react";
import { KeyRound, ShieldAlert, X } from "lucide-react";
import { signIn } from "next-auth/react";

type Props = {
  /** Called after the user successfully re-authenticates */
  onReauthenticated?: () => void;
  /** Called when the user dismisses the prompt */
  onDismiss?: () => void;
  /** Number of pending unsynced changes to display */
  pendingCount?: number;
};

export default function SessionExpirationPrompt({
  onReauthenticated,
  onDismiss,
  pendingCount = 0,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const handleLogin = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        callbackUrl: window.location.href,
      });

      if (result?.ok) {
        onReauthenticated?.();
      } else {
        setFailCount((prev) => prev + 1);
      }
    } catch {
      setFailCount((prev) => prev + 1);
    } finally {
      setIsLoading(false);
    }
  }, [onReauthenticated]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    onDismiss?.();
  }, [onDismiss]);

  // After dismissal, show a minimal persistent indicator
  if (dismissed) {
    return (
      <div className="fixed bottom-4 right-4 z-[90] flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-950/80 px-4 py-2 text-xs font-bold text-amber-200 shadow-lg backdrop-blur-md">
        <ShieldAlert className="h-3.5 w-3.5" />
        <span>Session expired Â· Changes saved locally</span>
        <button
          onClick={() => setDismissed(false)}
          className="ml-2 rounded-full border border-amber-400/30 px-2 py-0.5 text-[10px] font-black uppercase hover:bg-amber-400/10 transition-colors"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[90] w-full max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="overflow-hidden rounded-2xl border border-amber-400/40 bg-[#1a1510] shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-400/20 bg-amber-500/5 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20">
              <KeyRound className="h-4 w-4 text-amber-400" />
            </div>
            <span className="text-sm font-bold text-amber-100">
              Session Expired
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs leading-relaxed text-[#c7b289]">
            Your session has expired. Don&apos;t worry â€” your{" "}
            {pendingCount > 0 && (
              <span className="font-bold text-amber-300">
                {pendingCount} unsaved change{pendingCount !== 1 ? "s" : ""}
              </span>
            )}{" "}
            {pendingCount > 0 ? "are" : "changes are"} stored safely on this
            device and will sync once you log back in.
          </p>

          <p className="text-[10px] text-[#7b6f63]">
            You can continue editing â€” nothing will be lost.
          </p>

          {failCount >= 3 && (
            <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
              Login failed {failCount} times. Your changes remain safe locally.
              Try again later or check your credentials.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-white/5 px-5 py-3">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className={`flex-1 rounded-full py-2.5 text-xs font-black uppercase tracking-wide transition-all ${
              isLoading
                ? "bg-white/10 text-white/40 cursor-wait"
                : "bg-gradient-to-r from-[#82693c] to-[#604b2d] text-black shadow-[0_0_10px_rgba(130,105,60,0.3)] hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {isLoading ? "Logging inâ€¦" : "Log In Again"}
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-full border border-white/15 px-4 py-2.5 text-xs font-bold text-white/60 hover:bg-white/5 transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
