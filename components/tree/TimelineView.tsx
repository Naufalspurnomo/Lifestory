import { useMemo } from "react";
import { FamilyNode } from "../../lib/types/tree";
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

export default function TimelineView({ nodes, onSelectNode }: TimelineViewProps) {
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
    <div className="relative mx-auto w-full max-w-4xl p-8">
      <div className="absolute bottom-10 left-1/2 top-10 w-0.5 -translate-x-1/2 bg-gradient-to-b from-transparent via-gold-300 to-transparent" />

      {groupedEvents.map((group) => (
        <div key={group.decade} className="relative mb-12">
          <div className="sticky top-4 z-10 mb-6 flex justify-center">
            <div className="rounded-full border border-gold-200 bg-white/90 px-4 py-1 font-playfair text-sm font-bold text-gold-700 shadow-sm backdrop-blur">
              {group.decade}s
            </div>
          </div>

          <div className="space-y-8">
            {group.events.map((event, idx) => {
              const isLeft = idx % 2 === 0;
              return (
                <div
                  key={`${event.node.id}-${event.type}`}
                  className={`group relative flex items-center ${
                    isLeft ? "flex-row" : "flex-row-reverse"
                  }`}
                >
                  <div className="absolute left-1/2 top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-gold-400 bg-white shadow-sm transition-transform group-hover:scale-125" />

                  <div
                    className={`w-[calc(50%-2rem)] ${
                      isLeft ? "pr-8 text-right" : "pl-8 text-left"
                    }`}
                  >
                    <div
                      onClick={() => onSelectNode(event.node)}
                      className="cursor-pointer rounded-xl border border-warm-200 bg-white p-4 shadow-sm transition-all group-hover:border-gold-300 group-hover:shadow-md"
                    >
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-warmMuted">
                        {event.year} •{" "}
                        {event.type === "birth"
                          ? `🐣 ${copy.birth}`
                          : `🕯️ ${copy.death}`}
                      </span>
                      <h4 className="mb-1 font-playfair text-lg font-bold text-warmText transition-colors group-hover:text-gold-700">
                        {event.node.label}
                      </h4>
                      <div className="flex items-center justify-end gap-2 text-xs text-warmMuted">
                        {event.node.imageUrl && (
                          <img
                            src={event.node.imageUrl}
                            className="h-6 w-6 rounded-full object-cover"
                            alt=""
                          />
                        )}
                        <span>
                          {copy.generation} {event.node.generation}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-[calc(50%-2rem)]" />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {events.length === 0 && (
        <div className="py-20 text-center italic text-warmMuted">{copy.empty}</div>
      )}
    </div>
  );
}
