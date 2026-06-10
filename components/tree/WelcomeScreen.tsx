"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpenText,
  Camera,
  Sparkles,
  TreePine,
  Users,
} from "lucide-react";
import { useLanguage } from "../providers/LanguageProvider";

type Props = {
  userName: string;
  onStart: () => void;
};

export default function WelcomeScreen({ userName, onStart }: Props) {
  const { locale } = useLanguage();
  const reduce = useReducedMotion();
  const copy =
    locale === "id"
      ? {
          badge: "Mulai Perjalanan",
          title: "Selamat datang",
          subtitle: "Mari mulai abadikan sejarah keluarga besar Anda hari ini.",
          features: [
            {
              icon: TreePine,
              title: "Pohon silsilah interaktif",
              desc: "Susun garis keturunan generasi demi generasi.",
            },
            {
              icon: Camera,
              title: "Arsip foto dan dokumen",
              desc: "Simpan kenangan keluarga di satu ruang aman.",
            },
            {
              icon: BookOpenText,
              title: "Biografi tiap anggota",
              desc: "Tuliskan kisah hidup yang layak diwariskan.",
            },
            {
              icon: Users,
              title: "Kolaborasi keluarga",
              desc: "Undang anggota untuk ikut menambahkan cerita.",
            },
          ],
          cta: "Mulai Buat Pohon Keluarga",
          hint: "Anda akan menjadi simpul pertama di pohon silsilah",
        }
      : {
          badge: "Begin the Journey",
          title: "Welcome",
          subtitle: "Start preserving your family history today.",
          features: [
            {
              icon: TreePine,
              title: "Interactive family tree",
              desc: "Map your lineage generation by generation.",
            },
            {
              icon: Camera,
              title: "Photo and document archive",
              desc: "Keep family memories in one secure space.",
            },
            {
              icon: BookOpenText,
              title: "Biography per member",
              desc: "Tell life stories worth passing down.",
            },
            {
              icon: Users,
              title: "Family collaboration",
              desc: "Invite members to add their voice.",
            },
          ],
          cta: "Start Creating Family Tree",
          hint: "You will become the first node in the family tree",
        };

  return (
    <div className="relative flex min-h-[600px] items-center justify-center overflow-hidden p-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-12 h-72 w-72 rounded-full bg-[#dfceb0]/45 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-[#ece2cc]/65 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0.01 : 0.55, ease: "easeOut" }}
        className="relative z-10 w-full max-w-2xl space-y-8 text-center"
      >
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#dccfb3] bg-white/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#82693c] backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#82693c]" />
            {copy.badge}
          </p>

          <div className="relative mx-auto h-32 w-32">
            <div className="absolute inset-0 animate-pulse rounded-full bg-[#dfceb0]/40" />
            <div className="absolute inset-3 flex items-center justify-center rounded-full border border-[#dccfb3] bg-[linear-gradient(150deg,#fff8ea_0%,#efe4d0_100%)] text-[#82693c] shadow-[0_18px_36px_rgba(130,105,60,0.18)]">
              <TreePine className="h-12 w-12" />
            </div>
          </div>

          <h1 className="font-serif text-[clamp(2rem,4vw,3rem)] leading-tight text-[#3f342d]">
            {copy.title},{" "}
            <span className="bg-gradient-to-r from-[#82693c] to-[#82693c] bg-clip-text text-transparent">
              {userName}
            </span>
          </h1>
          <p className="text-base leading-relaxed text-[#73685f] md:text-lg">
            {copy.subtitle}
          </p>
        </div>

        <div className="grid gap-3 text-left sm:grid-cols-2">
          {copy.features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex items-start gap-3 rounded-2xl border border-[#dfd2be] bg-white/82 p-4 shadow-[0_8px_18px_rgba(59,43,24,0.06)] backdrop-blur-sm transition hover:border-[#c8b187] hover:bg-white"
              >
                <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-[#dccfb3] bg-[#fdfbf6] text-[#82693c]">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-[#3f342d]">{feature.title}</p>
                  <p className="mt-0.5 text-sm text-[#7b6f63]">
                    {feature.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#82693c] to-[#604b2d] px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-[0_16px_36px_rgba(130,105,60,0.34)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(130,105,60,0.42)]"
          >
            {copy.cta}
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-sm text-[#7b6f63]">{copy.hint}</p>
        </div>
      </motion.div>
    </div>
  );
}
