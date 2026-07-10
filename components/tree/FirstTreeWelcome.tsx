"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  GitBranch,
  HeartHandshake,
  Loader2,
  UserRoundPlus,
  UsersRound,
  X,
} from "lucide-react";
import { useLanguage } from "../providers/LanguageProvider";

export type FirstTreeRelationship = "parent" | "partner" | "child" | "sibling";

type Props = {
  rootName: string;
  isSubmitting: boolean;
  error: string | null;
  onDismiss: () => void;
  onChooseRelationship: (relationship: FirstTreeRelationship) => void;
};

export default function FirstTreeWelcome({
  rootName,
  isSubmitting,
  error,
  onDismiss,
  onChooseRelationship,
}: Props) {
  const { locale } = useLanguage();
  const [mode, setMode] = useState<"welcome" | "relationships">("welcome");
  const reduceMotion = useReducedMotion();

  const copy = useMemo(
    () =>
      locale === "id"
        ? {
            label: "Arsip keluarga pertama",
            title: "Selamat datang di Lifestory",
            body:
              "Node pertama sudah tersimpan. Sekarang, hubungkan orang-orang yang membentuk cerita keluarga Anda.",
            addMember: "Tambahkan anggota",
            later: "Nanti saja",
            chooseTitle: `Hubungkan dengan ${rootName}`,
            chooseBody: "Pilih hubungan untuk anggota berikutnya.",
            back: "Kembali",
            parent: "Orang tua",
            partner: "Pasangan",
            child: "Anak",
            sibling: "Saudara",
            close: "Tutup welcome",
          }
        : {
            label: "First family record",
            title: "Welcome to Lifestory",
            body:
              "Your first node is saved. Now connect the people who shape your family story.",
            addMember: "Add a family member",
            later: "Maybe later",
            chooseTitle: `Connect ${rootName}`,
            chooseBody: "Choose the next family relationship.",
            back: "Back",
            parent: "Parent",
            partner: "Partner",
            child: "Child",
            sibling: "Sibling",
            close: "Dismiss welcome",
          },
    [locale, rootName]
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        event.preventDefault();
        onDismiss();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onDismiss]);

  const relationships: Array<{
    id: FirstTreeRelationship;
    label: string;
    Icon: typeof UserRoundPlus;
  }> = [
    { id: "parent", label: copy.parent, Icon: UserRoundPlus },
    { id: "partner", label: copy.partner, Icon: HeartHandshake },
    { id: "child", label: copy.child, Icon: Baby },
    { id: "sibling", label: copy.sibling, Icon: UsersRound },
  ];

  return (
    <motion.section
      role="region"
      aria-label={copy.title}
      aria-live="polite"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="absolute bottom-4 left-3 right-3 z-40 border border-[#dccfb3] bg-[#fdfbf6]/98 p-4 text-[#3f342d] shadow-[0_18px_36px_rgba(59,43,24,0.14)] backdrop-blur-sm sm:bottom-5 sm:left-4 sm:right-auto sm:w-[22rem] lg:bottom-auto lg:left-6 lg:top-24"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#dccfb3] bg-[#f5efe1] text-[#82693c]">
            <GitBranch className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#82693c]">
              {copy.label}
            </p>
            <h2 className="mt-1 text-base font-bold leading-snug text-[#3f342d]">
              {mode === "welcome" ? copy.title : copy.chooseTitle}
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          disabled={isSubmitting}
          title={copy.close}
          aria-label={copy.close}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#73685f] transition hover:bg-[#f5efe1] hover:text-[#3f342d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82693c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdfbf6] disabled:cursor-wait disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
        </button>
      </div>

      {mode === "welcome" ? (
        <>
          <p className="mt-3 text-sm leading-6 text-[#5a4d42]">{copy.body}</p>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode("relationships")}
              disabled={isSubmitting}
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full bg-[#82693c] px-4 py-2 text-sm font-bold text-white shadow-[0_10px_20px_rgba(130,105,60,0.22)] transition hover:bg-[#6f5932] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82693c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdfbf6] disabled:cursor-wait disabled:opacity-60"
            >
              {copy.addMember}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDismiss}
              disabled={isSubmitting}
              className="inline-flex min-h-10 items-center justify-center rounded-full px-3 py-2 text-sm font-bold text-[#5a4d42] transition hover:bg-[#f5efe1] hover:text-[#3f342d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82693c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdfbf6] disabled:cursor-wait disabled:opacity-60"
            >
              {copy.later}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm leading-6 text-[#5a4d42]">{copy.chooseBody}</p>
          <div className="mt-3 overflow-hidden border border-[#ece2cc] bg-white">
            {relationships.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onChooseRelationship(id)}
                disabled={isSubmitting}
                className="flex min-h-11 w-full items-center gap-3 border-b border-[#ece2cc] px-3 text-left text-sm font-bold text-[#3f342d] transition last:border-b-0 hover:bg-[#f5efe1] focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#82693c] disabled:cursor-wait disabled:opacity-60"
              >
                <Icon className="h-4 w-4 shrink-0 text-[#82693c]" />
                <span className="min-w-0 flex-1">{label}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#9c8e7e]" />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setMode("welcome")}
            disabled={isSubmitting}
            className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg px-1 text-sm font-bold text-[#5a4d42] transition hover:text-[#3f342d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82693c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdfbf6] disabled:cursor-wait disabled:opacity-60"
          >
            <ArrowLeft className="h-4 w-4" />
            {copy.back}
          </button>
        </>
      )}

      {error && (
        <p role="alert" className="mt-3 text-xs font-semibold leading-5 text-[#b34a4a]">
          {error}
        </p>
      )}
    </motion.section>
  );
}
