"use client";

import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    // TODO: integrate forgot-password email flow.
    await new Promise((resolve) => setTimeout(resolve, 700));
    setStatus("sent");
  }

  return (
    <div className="bg-white">
      <div className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-16">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-forest-600">Password reset</p>
          <h1 className="text-3xl font-semibold text-slate-900">Forgot your password?</h1>
          <p className="text-slate-700">Enter your email and we&apos;ll send reset instructions.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
          <label className="space-y-1 text-sm text-slate-700">
            Email
            <input
              required
              name="email"
              type="email"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100"
            />
          </label>
          <Button type="submit" block disabled={status === "loading"}>
            {status === "sent" ? "Email sent" : status === "loading" ? "Sending..." : "Send reset link"}
          </Button>
          <div className="text-center text-sm text-forest-700">
            Remembered?{" "}
            <Link href="/auth/login" className="font-semibold hover:text-forest-800">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
