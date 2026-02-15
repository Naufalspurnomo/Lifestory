"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { galleryItems } from "../../lib/content/galleryItems";
import { useLanguage } from "../../components/providers/LanguageProvider";

type LocalizedGalleryMeta = {
  subtitle: string;
  summary: string;
  era: string;
  palette: string;
};

const localizedGalleryMeta: Record<
  string,
  { id: LocalizedGalleryMeta; en: LocalizedGalleryMeta }
> = {
  "ivory-classic": {
    id: {
      subtitle: "Memoar hidup personal",
      summary:
        "Potret hitam-putih yang tegas untuk kisah hidup personal, perjalanan batin, dan momen penting yang membentuk karakter.",
      era: "Klasik Modern",
      palette: "Monokrom Noir",
    },
    en: {
      subtitle: "Personal life memoir",
      summary:
        "A bold black-and-white portrait for personal journeys, inner growth, and defining life moments.",
      era: "Modern Classic",
      palette: "Monochrome Noir",
    },
  },
  "royal-navy": {
    id: {
      subtitle: "Edisi tribute keluarga",
      summary:
        "Siluet lembut dan nuansa hangat untuk mengenang sosok ibu, berisi cerita masa kecil, pengorbanan, dan kasih yang diwariskan.",
      era: "Lintas Generasi",
      palette: "Krim Hangat",
    },
    en: {
      subtitle: "Family tribute edition",
      summary:
        "A soft silhouette with warm tones to honor a mother figure, filled with childhood stories, sacrifice, and enduring love.",
      era: "Cross Generation",
      palette: "Warm Cream",
    },
  },
  "crimson-legacy": {
    id: {
      subtitle: "Kronik foto keluarga",
      summary:
        "Berbasis foto keluarga, cocok untuk kisah ayah sebagai figur sentral: nilai hidup, perjuangan, dan kebersamaan lintas generasi.",
      era: "Generasi Kini",
      palette: "Teal Gading",
    },
    en: {
      subtitle: "Family photo chronicle",
      summary:
        "Built from family photos, ideal for a father's central journey: values, struggles, and togetherness across generations.",
      era: "Current Generation",
      palette: "Teal Ivory",
    },
  },
  "emerald-vault": {
    id: {
      subtitle: "Edisi memori warisan",
      summary:
        "Sampul bernuansa vintage hangat untuk memoar keteguhan hidup, kenangan masa tua, dan warisan nilai yang tetap menyala.",
      era: "Kisah Seumur Hidup",
      palette: "Amber Klasik",
    },
    en: {
      subtitle: "Legacy memory edition",
      summary:
        "A warm vintage cover for memoirs of resilience, later-life memories, and values passed forward.",
      era: "Lifetime Story",
      palette: "Amber Vintage",
    },
  },
};

export default function GalleryPage() {
  return (
    <Suspense fallback={<GalleryPageSkeleton />}>
      <GalleryPageContent />
    </Suspense>
  );
}

function GalleryPageContent() {
  const { locale } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const activeItem = activeIndex !== null ? galleryItems[activeIndex] : null;
  const copy =
    locale === "id"
      ? {
          sectionLabel: "Galeri",
          title: "Koleksi Biografi Pilihan",
          desc:
            "Halaman ini memperluas section unggulan dari beranda. Koleksi yang sama, sekarang dengan konteks lebih kaya, catatan era, dan detail identitas visual tiap sampul biografi.",
          backHome: "Kembali ke Beranda",
          era: "Era",
          palette: "Palet",
          tips: "Tips: gunakan tombol panah kiri/kanan untuk melihat sampul dengan cepat.",
          prev: "Sebelumnya",
          next: "Berikutnya",
          close: "Tutup",
          ariaCloseModal: "Tutup modal",
          ariaPrevCover: "Sampul sebelumnya",
          ariaNextCover: "Sampul berikutnya",
          ariaOpenDetails: (title: string) => `Buka detail ${title}`,
        }
      : {
          sectionLabel: "Gallery",
          title: "Featured Biography Collections",
          desc:
            "This page expands the featured section from homepage. Same collection, now with richer context, era notes, and visual identity detail for each biography cover.",
          backHome: "Back to Home",
          era: "Era",
          palette: "Palette",
          tips: "Tips: use left/right arrow keys to browse covers quickly.",
          prev: "Prev",
          next: "Next",
          close: "Close",
          ariaCloseModal: "Close modal",
          ariaPrevCover: "Previous cover",
          ariaNextCover: "Next cover",
          ariaOpenDetails: (title: string) => `Open ${title} details`,
        };

  const getLocalizedMeta = useCallback(
    (itemId: string): LocalizedGalleryMeta | null => {
      const itemMeta = localizedGalleryMeta[itemId];
      if (!itemMeta) return null;
      return locale === "id" ? itemMeta.id : itemMeta.en;
    },
    [locale]
  );

  const activeMeta = activeItem ? getLocalizedMeta(activeItem.id) : null;

  const replaceItemQuery = useCallback(
    (itemId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (itemId) {
        params.set("item", itemId);
      } else {
        params.delete("item");
      }

      const query = params.toString();
      const nextUrl = query ? `${pathname}?${query}` : pathname;
      router.replace(nextUrl, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const openItem = useCallback(
    (index: number) => {
      setActiveIndex(index);
      replaceItemQuery(galleryItems[index].id);
    },
    [replaceItemQuery],
  );

  const closeModal = useCallback(() => {
    setActiveIndex(null);
    replaceItemQuery(null);
  }, [replaceItemQuery]);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => {
      if (prev === null) return prev;
      const nextIndex = (prev + 1) % galleryItems.length;
      replaceItemQuery(galleryItems[nextIndex].id);
      return nextIndex;
    });
  }, [replaceItemQuery]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => {
      if (prev === null) return prev;
      const prevIndex = (prev - 1 + galleryItems.length) % galleryItems.length;
      replaceItemQuery(galleryItems[prevIndex].id);
      return prevIndex;
    });
  }, [replaceItemQuery]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const itemId = searchParams.get("item");

    if (!itemId) {
      setActiveIndex(null);
      return;
    }

    const indexFromQuery = galleryItems.findIndex((item) => item.id === itemId);
    if (indexFromQuery === -1) return;

    setActiveIndex((prev) => (prev === indexFromQuery ? prev : indexFromQuery));
  }, [searchParams]);

  useEffect(() => {
    if (activeIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, closeModal, goNext, goPrev]);

  const modal = activeItem ? (
    <div
      className="fixed inset-0 z-[120] bg-[rgba(16,11,7,0.76)] backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      onClick={closeModal}
    >
      <div className="mx-auto flex min-h-full w-full max-w-6xl items-center justify-center p-3 sm:p-5 md:p-8">
        <div
          className="relative w-full overflow-hidden rounded-[24px] border border-[#bca783]/45 bg-[#f5efe4] shadow-[0_28px_60px_rgba(17,12,8,0.42)] md:max-h-[calc(100vh-4rem)]"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={closeModal}
            className="absolute right-3 top-3 z-20 hidden h-10 w-10 items-center justify-center rounded-full border border-[#d9ccb8] bg-white/90 text-[#5d4f42] shadow-sm transition hover:bg-white md:inline-flex"
            aria-label={copy.ariaCloseModal}
          >
            <X className="h-5 w-5" />
          </button>

          <div className="grid md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <div className="relative h-[42vh] min-h-[280px] md:h-auto md:min-h-[560px]">
              <Image
                src={activeItem.src}
                alt={activeItem.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>

            <div className="max-h-[48vh] space-y-5 overflow-y-auto p-6 md:max-h-[calc(100vh-4rem)] md:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a68553]">
                {activeMeta?.subtitle || activeItem.subtitle}
              </p>
              <h2 className="font-serif text-[clamp(2rem,4vw,3.2rem)] leading-tight text-[#3f342d]">
                {activeItem.title}
              </h2>

              <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#705f4e]">
                <span className="rounded-full border border-[#dfd2bb] bg-white/80 px-2.5 py-1">
                  {copy.era}: {activeMeta?.era || activeItem.era}
                </span>
                <span className="rounded-full border border-[#dfd2bb] bg-white/80 px-2.5 py-1">
                  {copy.palette}: {activeMeta?.palette || activeItem.palette}
                </span>
              </div>

              <p className="max-w-xl text-base leading-relaxed text-[#6f6358] md:text-lg">
                {activeMeta?.summary || activeItem.summary}
              </p>

              <p className="text-sm text-[#7b6e61]">
                {copy.tips}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-[#deceb6] bg-[#f7f1e6] p-3 md:hidden">
            <button
              type="button"
              onClick={goPrev}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#d9ccb8] bg-white text-sm font-semibold text-[#5d4f42]"
              aria-label={copy.ariaPrevCover}
            >
              <ChevronLeft className="h-4 w-4" />
              {copy.prev}
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#e4c9c9] bg-[#fff5f5] text-sm font-semibold text-[#9b4d4d]"
              aria-label={copy.ariaCloseModal}
            >
              <X className="h-4 w-4" />
              {copy.close}
            </button>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#d9ccb8] bg-white text-sm font-semibold text-[#5d4f42]"
              aria-label={copy.ariaNextCover}
            >
              {copy.next}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={goPrev}
            className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#d9ccb8] bg-white/90 text-[#5d4f42] shadow-sm transition hover:bg-white md:inline-flex"
            aria-label={copy.ariaPrevCover}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={goNext}
            className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#d9ccb8] bg-white/90 text-[#5d4f42] shadow-sm transition hover:bg-white md:inline-flex"
            aria-label={copy.ariaNextCover}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="bg-[#f7f5f1] text-[#40342c]">
      <section className="mx-auto max-w-[1320px] px-6 py-16 md:py-20">
        <div className="mb-10 flex flex-col gap-5 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a68553]">
              {copy.sectionLabel}
            </p>
            <h1 className="font-serif text-[clamp(2rem,4.8vw,3.8rem)] leading-[1.06] text-[#3f342d]">
              {copy.title}
            </h1>
            <p className="text-base leading-relaxed text-[#72675f] md:text-lg">
              {copy.desc}
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 self-start rounded-full border border-[#dccfb7] bg-white/80 px-5 py-2 text-sm font-semibold text-[#6c5a49] transition hover:border-[#c7b289] hover:bg-white hover:text-[#4c3f34] md:self-auto"
          >
            {copy.backHome}
            <span aria-hidden>&rarr;</span>
          </Link>
        </div>

        <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-4">
          {galleryItems.map((item, index) => (
            <article
              key={item.id}
              className="group overflow-hidden rounded-[22px] border border-[#d7cbb6] bg-white shadow-[0_14px_34px_rgba(88,67,37,0.12)] transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_24px_42px_rgba(88,67,37,0.2)]"
            >
              <button
                type="button"
                onClick={() => openItem(index)}
                className="block w-full text-left"
                aria-label={copy.ariaOpenDetails(item.title)}
              >
                <div className="relative aspect-[2/3] overflow-hidden">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    priority={index < 2}
                  />
                </div>

                <div className="space-y-3 p-5">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#aa8b5c]">
                      {getLocalizedMeta(item.id)?.subtitle || item.subtitle}
                    </p>
                    <h2 className="font-serif text-2xl leading-tight text-[#3f342d]">
                      {item.title}
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#705f4e]">
                    <span className="rounded-full border border-[#dfd2bb] bg-[#faf7f1] px-2.5 py-1">
                      {copy.era}: {getLocalizedMeta(item.id)?.era || item.era}
                    </span>
                    <span className="rounded-full border border-[#dfd2bb] bg-[#faf7f1] px-2.5 py-1">
                      {getLocalizedMeta(item.id)?.palette || item.palette}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed text-[#6f6358]">
                    {getLocalizedMeta(item.id)?.summary || item.summary}
                  </p>
                </div>
              </button>
            </article>
          ))}
        </div>
      </section>

      {isMounted && modal ? createPortal(modal, document.body) : null}
    </div>
  );
}

function GalleryPageSkeleton() {
  return (
    <div className="bg-[#f7f5f1] text-[#40342c]">
      <section className="mx-auto max-w-[1320px] px-6 py-16 md:py-20">
        <div className="mb-10 space-y-4">
          <div className="h-3 w-20 animate-pulse rounded-full bg-[#e9e0cf]" />
          <div className="h-10 w-[min(560px,90%)] animate-pulse rounded-xl bg-[#e9e0cf]" />
          <div className="h-5 w-[min(760px,95%)] animate-pulse rounded-lg bg-[#ece4d6]" />
        </div>
        <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-4">
          {galleryItems.map((item) => (
            <div
              key={item.id}
              className="aspect-[2/3] animate-pulse rounded-[22px] border border-[#ded2be] bg-[#efe6d8]"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
