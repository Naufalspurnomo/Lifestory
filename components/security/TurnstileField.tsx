"use client";

import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";

type TurnstileWindow = Window & {
  turnstile?: {
    render: (
      element: HTMLElement,
      options: {
        sitekey: string;
        callback: (token: string) => void;
        "expired-callback": () => void;
        "error-callback": () => void;
      }
    ) => string;
    remove: (widgetId: string) => void;
  };
};

export function TurnstileField() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const elementId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(
    () => typeof window !== "undefined" && Boolean((window as TurnstileWindow).turnstile)
  );
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!siteKey || !scriptReady || !containerRef.current || widgetIdRef.current) return;
    const turnstile = (window as TurnstileWindow).turnstile;
    if (!turnstile) return;

    widgetIdRef.current = turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: setToken,
      "expired-callback": () => setToken(""),
      "error-callback": () => setToken(""),
    });

    return () => {
      if (widgetIdRef.current) {
        turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [scriptReady, siteKey]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div
        id={elementId}
        ref={containerRef}
        className="min-h-[65px] overflow-hidden rounded-2xl border border-cream-300 bg-cream-50"
      />
      <input type="hidden" name="turnstileToken" value={token} readOnly />
    </>
  );
}
