"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { galleryItems } from "../lib/content/galleryItems";

const heroImage = "/hero-bg.jpg";

const highlights = [
  "Private family archive",
  "Curated biography layouts",
  "Shareable family tree workspace",
];

export default function HomePage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoggedIn = status === "authenticated";
  const isAdmin = user?.role === "admin";
  const isSubscribed = Boolean(user?.subscriptionActive);
  const displayName = user?.name?.trim() || "Member";
  const firstName = displayName.split(" ")[0];

  const primaryCta = isAdmin
    ? { href: "/dashboard", label: "Open Admin Dashboard" }
    : isSubscribed
    ? { href: "/app", label: "Continue Your Story" }
    : { href: "/subscribe", label: "Activate Your Plan" };

  const secondaryCta = isAdmin
    ? { href: "/app", label: "Open Family Trees" }
    : { href: "/gallery", label: "Explore Collections" };

  return (
    <div className="bg-[#f7f5f1] text-[#40342c]">
      <section className="relative min-h-[86vh] overflow-hidden">
        <div
          className="absolute inset-0 scale-[1.02] bg-cover bg-center"
          style={{ backgroundImage: `url("${heroImage}")` }}
        />
        <div className="absolute inset-0 bg-[rgba(245,236,219,0.5)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.62)_0%,rgba(245,236,219,0.14)_40%,rgba(247,245,241,0.92)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.5),transparent_42%),radial-gradient(circle_at_84%_10%,rgba(228,191,112,0.2),transparent_32%)]" />

        <div className="relative mx-auto flex min-h-[86vh] max-w-6xl items-center justify-center px-6 pb-28 pt-24 text-center">
          <div className="max-w-4xl animate-[fade-in-up_0.7s_ease-out]">
            {isLoggedIn && (
              <p className="mx-auto mb-5 inline-flex items-center rounded-full border border-[#dccfb7] bg-[rgba(255,255,255,0.7)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7b6f63] backdrop-blur-sm">
                Welcome back, {firstName}
              </p>
            )}
            <h1 className="font-serif text-[clamp(3rem,8vw,6.2rem)] leading-[0.98] tracking-[-0.02em] text-[#3f342d]">
              We keep it for you.
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-[clamp(1.05rem,2vw,1.95rem)] leading-relaxed text-[#776b61]">
              Preserving the most precious stories, memories, and legacies for
              generations to come.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {status === "loading" && (
                <>
                  <div className="h-[58px] w-[250px] animate-pulse rounded-full border border-[#e2d4be] bg-white/70" />
                  <div className="h-[58px] w-[250px] animate-pulse rounded-full border border-[#e2d4be] bg-white/70" />
                </>
              )}

              {status === "unauthenticated" && (
                <>
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#e6ab2f] to-[#cc8a12] px-9 py-3.5 text-lg font-semibold text-white shadow-[0_16px_36px_rgba(169,116,21,0.34)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(169,116,21,0.42)]"
                  >
                    Start Your Story
                    <span aria-hidden>&rarr;</span>
                  </Link>
                  <Link
                    href="/app"
                    className="inline-flex items-center rounded-full border border-[#d7c4a1] bg-[rgba(255,255,255,0.74)] px-7 py-3.5 text-sm font-semibold tracking-[0.08em] text-[#6a584a] backdrop-blur-sm transition hover:bg-white"
                  >
                    EXPLORE FAMILY TREES
                  </Link>
                </>
              )}

              {isLoggedIn && (
                <>
                  <Link
                    href={primaryCta.href}
                    className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#e6ab2f] to-[#cc8a12] px-9 py-3.5 text-lg font-semibold text-white shadow-[0_16px_36px_rgba(169,116,21,0.34)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(169,116,21,0.42)]"
                  >
                    {primaryCta.label}
                    <span aria-hidden>&rarr;</span>
                  </Link>
                  <Link
                    href={secondaryCta.href}
                    className="inline-flex items-center rounded-full border border-[#d7c4a1] bg-[rgba(255,255,255,0.74)] px-7 py-3.5 text-sm font-semibold tracking-[0.08em] text-[#6a584a] backdrop-blur-sm transition hover:bg-white"
                  >
                    {secondaryCta.label.toUpperCase()}
                  </Link>
                </>
              )}
            </div>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-2">
              {highlights.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[#dccfb7] bg-[rgba(255,255,255,0.68)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7b6f63] backdrop-blur-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-24 text-center md:py-28">
        <h2 className="font-serif text-[clamp(2.1rem,5vw,4.1rem)] leading-[1.08] text-[#3f342d]">
          Your Story Deserves to Be Remembered
        </h2>
        <p className="mx-auto mt-8 max-w-4xl text-[clamp(0.65rem,1.25vw,1.05rem)] leading-[1.65] text-[#72675f]">
          Lifestory.co is a professional biography writing service dedicated to
          preserving human stories and memories. We transform your experiences,
          achievements, and cherished moments into beautifully crafted
          biographies that will be treasured for generations. Every life has a
          story worth telling, and we are here to help you tell yours.
        </p>
      </section>

      <section className="mx-auto max-w-[1320px] px-6 pb-24 md:pb-28">
        <div>
          <h2 className="text-center font-serif text-[clamp(2rem,4.8vw,3.85rem)] leading-[1.1] text-[#3f342d]">
            Featured Biography Collections
          </h2>
          <div className="mt-4 flex justify-center sm:justify-end">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 rounded-full border border-[#dccfb7] bg-white/75 px-5 py-2 text-sm font-semibold text-[#6c5a49] transition hover:border-[#c7b289] hover:bg-white hover:text-[#4c3f34]"
            >
              View More
              <span aria-hidden>&rarr;</span>
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:gap-8 xl:grid-cols-4">
          {galleryItems.map((book, index) => (
            <article
              key={book.id}
              className="group relative aspect-[2/3] overflow-hidden rounded-[20px] border border-[#d2c5ad] bg-white transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_24px_40px_rgba(49,35,15,0.22)]"
            >
              <Image
                src={book.src}
                alt={book.alt}
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                priority={index < 2}
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),rgba(0,0,0,0.18))]" />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
