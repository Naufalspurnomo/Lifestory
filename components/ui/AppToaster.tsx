"use client";

import { usePathname } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";
import { Toaster } from "sonner";
import { useLanguage } from "../providers/LanguageProvider";

export function AppToaster() {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const isWorkspace = pathname === "/app";

  return (
    <Toaster
      position="top-center"
      visibleToasts={3}
      duration={4000}
      gap={8}
      closeButton
      expand={false}
      richColors={false}
      theme="light"
      className={isWorkspace ? "lifestory-toaster lifestory-toaster--workspace" : "lifestory-toaster"}
      containerAriaLabel={locale === "id" ? "Notifikasi Lifestory" : "Lifestory notifications"}
      icons={{
        success: <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />,
        error: <AlertCircle className="h-4 w-4 text-danger" aria-hidden />,
        warning: <TriangleAlert className="h-4 w-4 text-warning" aria-hidden />,
        info: <Info className="h-4 w-4 text-brand-700" aria-hidden />,
        loading: <LoaderCircle className="h-4 w-4 animate-spin text-brand-700" aria-hidden />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "lifestory-toast !rounded-2xl !border-cream-300 !bg-cream-50 !font-sans !text-ink-800 !shadow-elev",
          title: "!line-clamp-2 !text-sm !font-semibold !leading-5",
          description: "!text-xs !leading-5 !text-ink-500",
          actionButton:
            "!h-8 !rounded-pill !bg-brand-700 !px-3 !text-xs !font-bold !text-white hover:!bg-brand-800",
          cancelButton:
            "!h-8 !rounded-pill !bg-cream-200 !px-3 !text-xs !font-bold !text-ink-700",
          closeButton:
            "!border-cream-300 !bg-cream-50 !text-ink-600 hover:!bg-cream-100",
        },
      }}
    />
  );
}
