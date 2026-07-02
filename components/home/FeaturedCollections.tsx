"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "../ui/Container";
import { Eyebrow } from "../ui/Eyebrow";
import { Reveal } from "../ui/Reveal";
import { DividerMotif } from "../ui/Ornament";
import { galleryItems } from "../../lib/content/galleryItems";

type Props = {
  copy: {
    eyebrow: string;
    title: string;
    lead: string;
    viewMore: string;
  };
};

export function FeaturedCollections({ copy }: Props) {
  const renderBookCard = (
    book: (typeof galleryItems)[number],
    index: number,
    layout: "hero" | "stack" | "wide"
  ) => {
    const isHero = layout === "hero";
    const isWide = layout === "wide";

    const cardClassName = isHero
      ? "group h-full overflow-hidden rounded-card-xl border border-cream-300 bg-[linear-gradient(180deg,#fffdf8_0%,#f7efe2_100%)] transition duration-500 ease-smooth hover:-translate-y-1 hover:shadow-deep"
      : isWide
        ? "group h-full overflow-hidden rounded-card-xl border border-cream-300 bg-white transition duration-500 ease-smooth hover:-translate-y-1 hover:shadow-deep"
        : "group h-full overflow-hidden rounded-card-lg border border-cream-300 bg-white transition duration-500 ease-smooth hover:-translate-y-1 hover:shadow-deep";

    const imageClassName = isHero
      ? "relative aspect-[4/5] overflow-hidden"
      : isWide
        ? "relative aspect-[16/9] overflow-hidden"
        : "relative aspect-[3/4] overflow-hidden";

    const bodyClassName = isHero
      ? "space-y-4 p-6 md:p-7"
      : isWide
        ? "space-y-3 p-5 md:p-7"
        : "space-y-3 p-5";

    const titleClassName = isHero
      ? "font-serif text-[clamp(2rem,3vw,2.8rem)] leading-[1.02] tracking-[-0.02em] text-ink-800"
      : isWide
        ? "font-serif text-[1.85rem] leading-tight tracking-[-0.02em] text-ink-800"
        : "font-serif text-[1.45rem] leading-tight tracking-[-0.02em] text-ink-800";

    const summaryClassName = isHero
      ? "text-base leading-relaxed text-ink-500 md:text-lg"
      : isWide
        ? "max-w-xl text-sm leading-relaxed text-ink-500 md:text-base"
        : "text-sm leading-relaxed text-ink-500";

    return (
      <Reveal
        key={book.id}
        delay={index * 0.07}
        variant="image"
        duration={0.75}
        className={isHero ? "sm:col-span-2 lg:col-span-7" : isWide ? "sm:col-span-2 lg:col-span-2" : "lg:col-span-1"}
      >
        <Link
          href={`/gallery?item=${book.id}`}
          aria-label={`Open ${book.title} in gallery`}
          className={`block ${cardClassName}`}
        >
          <div className="flex h-full flex-col">
            <div className={imageClassName}>
              <Image
                src={book.src}
                alt={book.alt}
                fill
                sizes={
                  isHero
                    ? "(max-width: 640px) 100vw, (max-width: 1280px) 100vw, 50vw"
                    : isWide
                      ? "(max-width: 640px) 100vw, (max-width: 1280px) 70vw, 50vw"
                      : "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                }
                className="object-cover transition duration-700 ease-smooth lg:group-hover:scale-[1.05]"
                priority={index < 2}
              />
            </div>

            <div className={bodyClassName}>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-400">
                  {book.era} · {book.palette}
                </p>
                <p className={titleClassName}>{book.title}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
                  {book.subtitle}
                </p>
              </div>

              <p className={summaryClassName}>{book.summary}</p>

              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-500 transition duration-300 group-hover:translate-x-0.5">
                {copy.viewMore}
                <ArrowRight className="h-3 w-3" />
              </p>
            </div>
          </div>
        </Link>
      </Reveal>
    );
  };

  return (
    <section className="relative bg-cream-50 section-y-md">
      <Container size="xl">
        <Reveal className="mb-16 flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-10">
          <div className="max-w-2xl">
            <Eyebrow>{copy.eyebrow}</Eyebrow>
            <h2 className="mt-4 font-serif text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.05] tracking-[-0.02em] text-ink-800">
              {copy.title}
            </h2>
            <DividerMotif className="mt-6" width={180} />
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-500 md:text-lg">
              {copy.lead}
            </p>
          </div>
          <Link
            href="/gallery"
            className="group/link inline-flex items-center gap-2 self-start rounded-pill border border-cream-300 bg-cream-50 px-5 py-2.5 text-sm font-semibold text-ink-700 transition hover:border-brand-300 hover:bg-cream-100 md:mt-1 md:self-start"
          >
            {copy.viewMore}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" />
          </Link>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-12 lg:gap-7">
          {renderBookCard(galleryItems[0], 0, "hero")}

          <div className="grid gap-5 sm:col-span-2 sm:grid-cols-2 lg:col-span-5">
            {renderBookCard(galleryItems[1], 1, "stack")}
            {renderBookCard(galleryItems[2], 2, "stack")}
          </div>

          <div className="lg:col-span-12">
            {renderBookCard(galleryItems[3], 3, "wide")}
          </div>
        </div>
      </Container>
    </section>
  );
}
