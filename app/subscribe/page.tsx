"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Film,
  Image as ImageIcon,
  Send,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "../../components/providers/LanguageProvider";
import { Button } from "../../components/ui/Button";

type PackageId = "jejak-hidup" | "arsip-keluarga" | "warisan-utuh";

type StudioPackage = {
  id: PackageId;
  name: string;
  price: string;
  description: string;
  items: string[];
  icon: LucideIcon;
};

export default function SubscribePage() {
  const { status } = useSession();
  const { locale } = useLanguage();
  const [pendingPackage, setPendingPackage] = useState<PackageId | null>(null);
  const [submittedPackage, setSubmittedPackage] = useState<PackageId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isId = locale === "id";
  const isAuthed = status === "authenticated";

  const copy = isId
    ? {
        label: "Paket Studio Lifestory",
        heading: "Jadikan arsip keluarga ini buku dan film yang bisa diwariskan.",
        intro:
          "Pohon keluarga gratis tetap bisa dipakai untuk mengumpulkan nama, foto, dan cerita. Paket studio dimulai saat keluarga ingin mengubah arsip itu menjadi buku, film, sesi foto, atau ilustrasi final.",
        cta: "Ajukan konsultasi",
        authCta: "Daftar gratis dulu",
        contact: "Bicarakan kebutuhan khusus",
        sentCta: "Terkirim",
        submitted: "Permintaan konsultasi tercatat. Tim Lifestory akan menindaklanjuti.",
        error: "Permintaan belum terkirim. Coba lagi sebentar.",
        consent:
          "Dengan mengirim konsultasi, Anda setuju tim Lifestory menghubungi Anda terkait paket studio.",
        packages: [
          {
            id: "jejak-hidup",
            name: "Jejak Hidup",
            price: "Rp10 juta",
            description: "Untuk satu tokoh utama dan arsip awal keluarga.",
            icon: BookOpen,
            items: [
              "2 x 90 menit wawancara",
              "Buku 60-80 halaman",
              "30 foto terkurasi",
              "2 hardcover",
              "Setup pohon keluarga dan 5 GB arsip",
            ],
          },
          {
            id: "arsip-keluarga",
            name: "Arsip Keluarga",
            price: "Rp20 juta",
            description: "Untuk keluarga yang ingin buku dan film pendek.",
            icon: Film,
            items: [
              "4 x 90 menit wawancara",
              "Hingga 3 narasumber",
              "Buku 100-120 halaman",
              "Film 5-7 menit",
              "5 buku dan 15 GB arsip",
            ],
          },
          {
            id: "warisan-utuh",
            name: "Warisan Utuh",
            price: "Rp30 juta",
            description: "Untuk dokumentasi keluarga lintas cabang yang lebih lengkap.",
            icon: ImageIcon,
            items: [
              "6 x 90 menit wawancara",
              "Hingga 6 narasumber",
              "Buku 140-160 halaman",
              "Film 12-15 menit",
              "Sesi foto, ilustrasi khusus, 10 buku, dan 30 GB arsip",
            ],
          },
        ] satisfies StudioPackage[],
      }
    : {
        label: "Lifestory Studio Packages",
        heading: "Turn this family archive into a book and film worth passing down.",
        intro:
          "The free family tree remains available for names, photos, and stories. Studio packages begin when the family wants a finished book, film, photo session, or illustration.",
        cta: "Request consultation",
        authCta: "Create a free account",
        contact: "Discuss a custom need",
        sentCta: "Sent",
        submitted: "Consultation request recorded. The Lifestory team will follow up.",
        error: "The request was not sent. Please try again shortly.",
        consent:
          "By requesting a consultation, you agree that Lifestory may contact you about studio packages.",
        packages: [
          {
            id: "jejak-hidup",
            name: "Jejak Hidup",
            price: "Rp10 million",
            description: "For one main subject and the family's first archive.",
            icon: BookOpen,
            items: [
              "2 x 90-minute interviews",
              "60-80 page book",
              "30 curated photos",
              "2 hardcovers",
              "Family tree setup and 5 GB archive",
            ],
          },
          {
            id: "arsip-keluarga",
            name: "Arsip Keluarga",
            price: "Rp20 million",
            description: "For families who want both a book and a short film.",
            icon: Film,
            items: [
              "4 x 90-minute interviews",
              "Up to 3 narrators",
              "100-120 page book",
              "5-7 minute film",
              "5 books and 15 GB archive",
            ],
          },
          {
            id: "warisan-utuh",
            name: "Warisan Utuh",
            price: "Rp30 million",
            description: "For a fuller cross-branch family documentation.",
            icon: ImageIcon,
            items: [
              "6 x 90-minute interviews",
              "Up to 6 narrators",
              "140-160 page book",
              "12-15 minute film",
              "Photo session, custom illustration, 10 books, and 30 GB archive",
            ],
          },
        ] satisfies StudioPackage[],
      };

  async function submitLead(packageInterest: PackageId) {
    if (!isAuthed) return;
    setPendingPackage(packageInterest);
    setError(null);
    try {
      const response = await fetch("/api/studio-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageInterest,
          milestone: "subscribe-page",
          consentAccepted: true,
        }),
      });
      if (!response.ok) throw new Error("lead failed");
      setSubmittedPackage(packageInterest);
    } catch {
      setError(copy.error);
    } finally {
      setPendingPackage(null);
    }
  }

  return (
    <main className="min-h-screen bg-cream-100 text-ink-800">
      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="max-w-3xl">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-brand-700">
            {copy.label}
          </p>
          <h1 className="mt-4 font-serif text-[clamp(2.3rem,5vw,4.7rem)] leading-[1.02] tracking-[-0.02em] text-ink-900">
            {copy.heading}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-600 sm:text-lg">
            {copy.intro}
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {copy.packages.map((item) => {
            const Icon = item.icon;
            const isSubmitted = submittedPackage === item.id;
            const isPending = pendingPackage === item.id;
            return (
              <article
                key={item.id}
                className="flex min-h-[31rem] flex-col rounded-[20px] border border-cream-300 bg-cream-50 p-6 shadow-soft"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-ink-900">{item.name}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-ink-500">
                      {item.description}
                    </p>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cream-300 bg-white text-brand-700">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>

                <p className="mt-6 font-serif text-4xl leading-none text-ink-900">
                  {item.price}
                </p>

                <ul className="mt-6 space-y-3 text-sm leading-relaxed text-ink-700">
                  {item.items.map((feature) => (
                    <li key={feature} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-700" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-7">
                  {isAuthed ? (
                    <Button
                      type="button"
                      block
                      size="lg"
                      loading={isPending}
                      disabled={isPending || isSubmitted}
                      iconRight={isSubmitted ? undefined : <Send className="h-4 w-4" />}
                      onClick={() => submitLead(item.id)}
                    >
                      {isSubmitted ? copy.sentCta : copy.cta}
                    </Button>
                  ) : (
                    <Link href="/auth/register?next=/subscribe">
                      <Button block size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                        {copy.authCta}
                      </Button>
                    </Link>
                  )}
                  {isSubmitted && (
                    <p className="mt-3 text-sm leading-relaxed text-success">
                      {copy.submitted}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-cream-300 pt-6 text-sm leading-relaxed text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-3xl">{copy.consent}</p>
          <Link href="/contact" className="font-semibold text-brand-700 underline-offset-4 hover:underline">
            {copy.contact}
          </Link>
        </div>
        {error && (
          <p role="alert" className="mt-4 text-sm font-semibold text-danger">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
