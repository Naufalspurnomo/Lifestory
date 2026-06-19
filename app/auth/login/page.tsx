"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthCurtain } from "../../../components/auth/AuthCurtain";

function LoginInner() {
  const searchParams = useSearchParams();
  return <AuthCurtain initialMode="login" next={searchParams.get("next") ?? "/app"} />;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<main className="min-h-[calc(100vh-78px)] bg-cream-100" />}
    >
      <LoginInner />
    </Suspense>
  );
}
