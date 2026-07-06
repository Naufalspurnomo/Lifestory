"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "../ui/Container";
import { Reveal } from "../ui/Reveal";
import { galleryItems } from "../../lib/content/galleryItems";
import { getGalleryLocalizedMeta } from "../../lib/content/galleryLocalizedMeta";
import { useLanguage } from "../providers/LanguageProvider";

type Props = {
  copy: {
    eyebrow: string;
    title: string;
    lead: string;
    viewMore: string;
  };
};

export function FeaturedCollections({ copy }: Props) {
  const { locale } = useLanguage();
  const leadBook = galleryItems[0];
  const archiveBooks = galleryItems.slice(1);
  const leadMeta = getGalleryLocalizedMeta(leadBook.id, locale);

  return (
    <section className="relative overflow-hidden bg-cream-100 section-y-md">
      <Container size="xl">
        <Reveal className="grid gap-8 border-y border-cream-300 py-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.55fr)] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase text-brand-700">{copy.eyebrow}</p>
            <h2 className="mt-4 max-w-2xl font-serif text-4xl leading-[1.05] text-ink-900 sm:text-5xl lg:text-6xl">
              {copy.title}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-500 md:text-lg">
              {copy.lead}
            </p>
          </div>
          <Link
            href="/gallery"
            className="group/link inline-flex w-fit items-center gap-3 self-start border-b border-brand-400 pb-2 text-sm font-semibold text-brand-700 transition hover:border-ink-900 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-4 focus-visible:ring-offset-cream-100 lg:justify-self-end"
          >
            {copy.viewMore}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" />
          </Link>
        </Reveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:items-start">
          <Reveal variant="image" duration={0.75}>
            <Link
              href={`/gallery?item=${leadBook.id}`}
              aria-label={`Open ${leadBook.title} in gallery`}
              className="group block overflow-hidden rounded-card-lg bg-ink-900 text-cream-50 shadow-elev transition duration-500 hover:-translate-y-1 hover:shadow-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-4 focus-visible:ring-offset-cream-100"
            >
              <div className="grid lg:grid-cols-[0.92fr_1fr]">
                <div className="relative min-h-[410px] overflow-hidden sm:min-h-[500px] lg:min-h-[620px]">
                  <Image
                    src={leadBook.src}
                    alt={leadBook.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover transition duration-700 ease-smooth lg:group-hover:scale-[1.04]"
                    priority
                  />
                </div>

                <div className="flex min-h-[340px] flex-col justify-between gap-10 p-6 sm:p-8 lg:p-10">
                  <div>
                    <p className="text-xs font-bold uppercase text-brand-300">01 / 04</p>
                    <h3 className="mt-5 max-w-md break-words font-serif text-4xl leading-[1.04] text-cream-50 sm:text-5xl">
                      {leadBook.title}
                    </h3>
                    <p className="mt-4 text-sm font-semibold uppercase text-cream-200">
                      {leadMeta?.subtitle ?? leadBook.subtitle}
                    </p>
                  </div>

                  <div className="space-y-6">
                    <p className="max-w-md text-base leading-relaxed text-cream-100/80">
                      {leadMeta?.summary ?? leadBook.summary}
                    </p>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-cream-50/15 pt-5 text-sm text-cream-100/75">
                      <span>{leadMeta?.era ?? leadBook.era}</span>
                      <span>{leadMeta?.palette ?? leadBook.palette}</span>
                    </div>
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-300 transition duration-300 group-hover:translate-x-1">
                      {copy.viewMore}
                      <ArrowRight className="h-4 w-4" />
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </Reveal>

          <div className="border-y border-cream-300">
            {archiveBooks.map((book, index) => {
              const bookMeta = getGalleryLocalizedMeta(book.id, locale);

              return (
                <Reveal
                  key={book.id}
                  className="border-b border-cream-300 last:border-b-0"
                  delay={(index + 1) * 0.05}
                  y={16}
                >
                  <Link
                    href={`/gallery?item=${book.id}`}
                    aria-label={`Open ${book.title} in gallery`}
                    className="group grid gap-5 py-6 transition hover:bg-cream-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-4 focus-visible:ring-offset-cream-100 sm:grid-cols-[128px_1fr]"
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-card border border-cream-300 bg-cream-50 sm:w-32">
                      <Image
                        src={book.src}
                        alt={book.alt}
                        fill
                        sizes="(max-width: 640px) 100vw, 128px"
                        className="object-cover transition duration-700 ease-smooth lg:group-hover:scale-[1.05]"
                      />
                    </div>

                    <div className="min-w-0 self-center pr-2">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold uppercase text-brand-700">
                        <span>{String(index + 2).padStart(2, "0")} / 04</span>
                        <span>{bookMeta?.era ?? book.era}</span>
                      </div>
                      <h3 className="mt-3 break-words font-serif text-2xl leading-tight text-ink-900 transition group-hover:text-brand-700 sm:text-3xl">
                        {book.title}
                      </h3>
                      <p className="mt-2 text-sm font-semibold uppercase text-ink-500">
                        {bookMeta?.subtitle ?? book.subtitle}
                      </p>
                      <p className="mt-4 text-sm leading-relaxed text-ink-600">
                        {bookMeta?.summary ?? book.summary}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
