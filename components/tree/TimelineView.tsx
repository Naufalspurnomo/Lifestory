import { useMemo } from "react";
import { Clock } from "lucide-react";
import { FamilyNode } from "../../lib/types/tree";
import { resolveDisplayMediaUrl } from "../../lib/media/public-url";
import { useLanguage } from "../providers/LanguageProvider";

interface TimelineViewProps {
  nodes: FamilyNode[];
  onSelectNode: (node: FamilyNode) => void;
}

interface TimelineEvent {
  year: number;
  type: "birth" | "death";
  node: FamilyNode;
}

export default function TimelineView({
  nodes,
  onSelectNode,
}: TimelineViewProps) {
  const { locale } = useLanguage();
  const copy =
    locale === "id"
      ? {
          birth: "Lahir",
          death: "Wafat",
          generation: "Generasi",
          empty:
            "Belum ada data tahun kelahiran/kematian untuk ditampilkan di linimasa.",
        }
      : {
          birth: "Born",
          death: "Passed",
          generation: "Generation",
          empty: "No birth/death year data to display in timeline yet.",
        };

  const events = useMemo(() => {
    const allEvents: TimelineEvent[] = [];
    nodes.forEach((node) => {
      if (node.year) allEvents.push({ year: node.year, type: "birth", node });
      if (node.deathYear)
        allEvents.push({ year: node.deathYear, type: "death", node });
    });
    return allEvents.sort((a, b) => b.year - a.year);
  }, [nodes]);

  const groupedEvents = useMemo(() => {
    const groups: { [key: number]: TimelineEvent[] } = {};
    events.forEach((event) => {
      const decade = Math.floor(event.year / 10) * 10;
      if (!groups[decade]) groups[decade] = [];
      groups[decade].push(event);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([decade, grouped]) => ({
        decade: Number(decade),
        events: grouped,
      }));
  }, [events]);

  return (
    <div className="relative mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      <div className="absolute bottom-10 left-5 top-10 w-0.5 bg-gradient-to-b from-transparent via-brand-300 to-transparent sm:left-1/2 sm:-translate-x-1/2" />

      {groupedEvents.map((group) => (
        <div
          key={group.decade}
          className="relative mb-14 animate-fade-in-up sm:mb-16"
        >
          <div className="sticky top-6 z-20 mb-10 flex justify-start pl-10 sm:justify-center sm:pl-0">
            <div className="relative overflow-hidden rounded-full border border-brand-200/50 bg-white/80 px-8 py-2 font-playfair text-sm font-bold text-brand-800 shadow-soft backdrop-blur-md">
              <span className="relative z-10 tracking-widest">
                {group.decade}s
              </span>
              <div className="absolute inset-0 z-0 bg-brand-gradient opacity-10" />
            </div>
          </div>

          <div className="space-y-10 sm:space-y-12">
            {group.events.map((event, idx) => {
              const isLeft = idx % 2 === 0;
              const displayImageUrl = event.node.imageUrl
                ? resolveDisplayMediaUrl(event.node.imageUrl)
                : null;

              const cardSideClasses = isLeft
                ? "sm:pr-10 sm:text-right"
                : "sm:pl-10 sm:text-left";
              const flexSideClasses = isLeft
                ? "sm:flex-row"
                : "sm:flex-row-reverse";
              const alignmentClasses = isLeft
                ? "justify-start sm:justify-end"
                : "justify-start";
              const textAlignClasses = isLeft
                ? "text-left sm:text-right"
                : "text-left";

              return (
                <div
                  key={`${event.node.id}-${event.type}`}
                  className={`group relative flex min-w-0 items-start sm:items-center ${flexSideClasses}`}
                >
                  <div className="absolute left-5 top-8 z-10 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-soft transition-transform duration-500 group-hover:scale-125 sm:left-1/2 sm:top-1/2 sm:-translate-y-1/2">
                    <div className="h-3 w-3 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(130,105,60,0.5)] transition-colors duration-300 group-hover:bg-brand-600" />
                  </div>

                  <div
                    className={`ml-12 min-w-0 w-[calc(100%-3rem)] sm:ml-0 sm:w-[calc(50%-2rem)] ${cardSideClasses}`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectNode(event.node)}
                      className={`relative w-full cursor-pointer overflow-hidden rounded-card-lg border border-warm-200 bg-white p-4 shadow-soft transition-all duration-300 ease-out hover:-translate-y-1 hover:border-brand-300 hover:shadow-elev focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100 group-hover:bg-cream-50 sm:p-5 ${textAlignClasses}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-50/0 to-brand-50/0 opacity-0 transition-opacity duration-500 group-hover:from-brand-50/50 group-hover:to-transparent group-hover:opacity-100" />

                      <div className="relative z-10">
                        <div
                          className={`mb-3 flex items-center gap-2 ${alignmentClasses}`}
                        >
                          <span className="rounded-pill bg-warm-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-700 shadow-sm">
                            {event.year}
                          </span>
                          <span className="rounded-pill border border-warm-200 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] text-warmMuted">
                            {event.type === "birth" ? copy.birth : copy.death}
                          </span>
                        </div>

                        <h4 className="mb-4 break-words font-playfair text-xl font-bold leading-tight text-ink-900 transition-colors duration-300 group-hover:text-brand-600 sm:text-2xl">
                          {event.node.label}
                        </h4>

                        <div
                          className={`flex items-center gap-3 text-sm text-ink-500 ${alignmentClasses}`}
                        >
                          {displayImageUrl && (
                            <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                              <img
                                src={displayImageUrl}
                                className="h-full w-full object-cover"
                                alt=""
                                loading="lazy"
                                decoding="async"
                              />
                            </div>
                          )}
                          <span className="font-medium tracking-wide">
                            {copy.generation} {event.node.generation}
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="hidden w-[calc(50%-2rem)] sm:block" />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-cream-100 shadow-inner">
            <Clock className="h-10 w-10 text-brand-300" strokeWidth={1.5} />
          </div>
          <p className="font-playfair text-2xl font-medium text-ink-500">
            {copy.empty}
          </p>
        </div>
      )}
    </div>
  );
}
