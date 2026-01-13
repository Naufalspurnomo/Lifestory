import { useMemo } from "react";
import { FamilyNode } from "../../lib/types/tree";

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
  const events = useMemo(() => {
    const allEvents: TimelineEvent[] = [];
    nodes.forEach((node) => {
      if (node.year) {
        allEvents.push({ year: node.year, type: "birth", node });
      }
      if (node.deathYear) {
        allEvents.push({ year: node.deathYear, type: "death", node });
      }
    });
    // Sort by year descending (newest first)
    return allEvents.sort((a, b) => b.year - a.year);
  }, [nodes]);

  // Group events by decade
  const groupedEvents = useMemo(() => {
    const groups: { [key: number]: TimelineEvent[] } = {};
    events.forEach((event) => {
      const decade = Math.floor(event.year / 10) * 10;
      if (!groups[decade]) groups[decade] = [];
      groups[decade].push(event);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([decade, events]) => ({
        decade: Number(decade),
        events,
      }));
  }, [events]);

  return (
    <div className="w-full max-w-4xl mx-auto p-8 relative">
      {/* Central Line */}
      <div className="absolute left-1/2 top-10 bottom-10 w-0.5 bg-gradient-to-b from-transparent via-gold-300 to-transparent -translate-x-1/2"></div>

      {groupedEvents.map((group) => (
        <div key={group.decade} className="mb-12 relative">
          <div className="flex justify-center mb-6 sticky top-4 z-10">
            <div className="bg-white/90 backdrop-blur border border-gold-200 text-gold-700 px-4 py-1 rounded-full text-sm font-bold shadow-sm font-playfair">
              {group.decade}s
            </div>
          </div>

          <div className="space-y-8">
            {group.events.map((event, idx) => {
              const isLeft = idx % 2 === 0;
              return (
                <div
                  key={`${event.node.id}-${event.type}`}
                  className={`flex items-center ${
                    isLeft ? "flex-row" : "flex-row-reverse"
                  } relative group`}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-4 border-gold-400 z-10 shadow-sm group-hover:scale-125 transition-transform"></div>

                  {/* Content Card */}
                  <div
                    className={`w-[calc(50%-2rem)] ${
                      isLeft ? "pr-8 text-right" : "pl-8 text-left"
                    }`}
                  >
                    <div
                      onClick={() => onSelectNode(event.node)}
                      className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md border border-warm-200 transition-all cursor-pointer group-hover:border-gold-300"
                    >
                      <span className="text-xs font-semibold uppercase tracking-wider text-warmMuted mb-1 block">
                        {event.year} •{" "}
                        {event.type === "birth" ? "🐣 Lahir" : "🕯️ Wafat"}
                      </span>
                      <h4 className="text-lg font-bold text-warmText font-playfair mb-1 group-hover:text-gold-700 transition-colors">
                        {event.node.label}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-warmMuted justify-end">
                        {event.node.imageUrl && (
                          <img
                            src={event.node.imageUrl}
                            className="w-6 h-6 rounded-full object-cover"
                            alt=""
                          />
                        )}
                        <span>Generasi {event.node.generation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Empty space for balance */}
                  <div className="w-[calc(50%-2rem)]"></div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {events.length === 0 && (
        <div className="text-center py-20 text-warmMuted italic">
          Belum ada data tahun kelahiran/kematian untuk ditampilkan di timeline.
        </div>
      )}
    </div>
  );
}
