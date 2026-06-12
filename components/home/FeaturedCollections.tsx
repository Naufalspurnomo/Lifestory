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
  return (
    <section className="relative bg-cream-50 section-y-md">
      <Container size="xl">
        <Reveal className="mb-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
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
            className="group/link inline-flex items-center gap-2 self-start rounded-pill border border-cream-300 bg-cream-50 px-5 py-2.5 text-sm font-semibold text-ink-700 transition hover:border-brand-300 hover:bg-cream-100 md:self-auto"
          >
            {copy.viewMore}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" />
          </Link>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-7">
          {galleryItems.map((book, index) => (
            <Reveal key={book.id} delay={index * 0.07} variant="image" duration={0.75}>
              <Link
                href={`/gallery?item=${book.id}`}
                aria-label={`Open ${book.title} in gallery`}
                className="group relative block aspect-[2/3] overflow-hidden rounded-card-lg border border-cream-300 bg-cream-50 transition duration-500 ease-smooth hover:-translate-y-1.5 hover:shadow-deep"
              >
                <Image
                  src={book.src}
                  alt={book.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  className="object-cover transition duration-700 ease-smooth lg:group-hover:scale-[1.05]"
                  priority={index < 2}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/0 to-transparent opacity-80"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-300">
                    {book.subtitle}
                  </p>
                  <p className="mt-1 font-serif text-xl leading-tight">
                    {book.title}
                  </p>
                  <p className="mt-2 inline-flex translate-y-2 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-200 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    {copy.viewMore}
                    <ArrowRight className="h-3 w-3" />
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
