import type { FamilyNode } from "../../lib/types/tree";

type FamilyMemberListProps = {
  nodes: FamilyNode[];
  selectedId: string | null;
  locale: string;
  onSelect: (nodeId: string) => void;
};

export default function FamilyMemberList({
  nodes,
  selectedId,
  locale,
  onSelect,
}: FamilyMemberListProps) {
  const copy =
    locale === "id"
      ? {
          title: "Daftar keluarga",
          open: "Buka di pohon",
          generation: "Generasi",
          year: "tahun tidak diketahui",
        }
      : {
          title: "Family list",
          open: "Open in tree",
          generation: "Generation",
          year: "year unknown",
        };

  const ordered = [...nodes].sort(
    (a, b) =>
      a.generation - b.generation ||
      (a.siblingOrder ?? 0) - (b.siblingOrder ?? 0) ||
      a.label.localeCompare(b.label)
  );

  return (
    <section
      aria-label={copy.title}
      className="sr-only fixed left-3 top-[152px] z-[70] max-h-[60dvh] w-[min(24rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-cream-300 bg-cream-50 p-3 shadow-xl focus-within:not-sr-only sm:left-4 sm:top-[116px] lg:top-20"
    >
      <h2 className="px-2 pb-2 text-sm font-bold text-ink-900">{copy.title}</h2>
      <ul className="space-y-1">
        {ordered.map((node) => (
          <li key={node.id}>
            <button
              type="button"
              onClick={() => onSelect(node.id)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                selectedId === node.id
                  ? "bg-brand-700 text-white"
                  : "text-ink-700 hover:bg-cream-200 focus-visible:bg-cream-200"
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold">{node.label}</span>
                <span className={selectedId === node.id ? "text-white/75" : "text-ink-500"}>
                  {copy.generation} {node.generation} - {node.year ?? copy.year}
                </span>
              </span>
              <span className="shrink-0 text-[0.72rem] font-bold uppercase tracking-[0.12em]">
                {copy.open}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
