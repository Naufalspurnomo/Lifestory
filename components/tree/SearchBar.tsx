import { useId, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { FamilyNode } from "../../lib/types/tree";
import { resolveDisplayMediaUrl } from "../../lib/media/public-url";
import { useLanguage } from "../providers/LanguageProvider";

interface SearchBarProps {
  nodes: FamilyNode[];
  onSelect: (nodeId: string) => void;
}

export default function SearchBar({ nodes, onSelect }: SearchBarProps) {
  const { locale } = useLanguage();
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const copy =
    locale === "id"
      ? {
          placeholder: "Cari keluarga...",
          label: "Cari anggota keluarga",
          generation: "Generasi",
          line: {
            paternal: "jalur Ayah",
            maternal: "jalur Ibu",
            self: "Anda",
            descendant: "keturunan",
            union: "pasangan",
            default: "keluarga",
          } as Record<string, string>,
          notFound: (text: string) => `Tidak ditemukan hasil untuk "${text}"`,
        }
      : {
          placeholder: "Search family...",
          label: "Search family members",
          generation: "Generation",
          line: {
            paternal: "Father's line",
            maternal: "Mother's line",
            self: "You",
            descendant: "Descendant",
            union: "Partner",
            default: "Family",
          } as Record<string, string>,
          notFound: (text: string) => `No result found for "${text}"`,
        };

  const filteredNodes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];

    return nodes
      .filter((node) => {
        const searchable = [
          node.label,
          node.year,
          node.deathYear,
          node.generation,
          node.line ? copy.line[node.line] : copy.line.default,
        ]
          .filter((value) => value !== null && value !== undefined)
          .join(" ")
          .toLowerCase();
        return searchable.includes(normalizedQuery);
      })
      .slice(0, 8);
  }, [copy.line, nodes, query]);

  function resultMeta(node: FamilyNode) {
    const line = node.line ? copy.line[node.line] : copy.line.default;
    const year = node.year ? String(node.year) : "?";
    return `${line} - ${copy.generation} ${node.generation} - ${year}`;
  }

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative">
        <input
          type="text"
          role="combobox"
          aria-label={copy.label}
          aria-autocomplete="list"
          aria-expanded={isOpen && Boolean(query)}
          aria-controls={listboxId}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setIsOpen(false);
          }}
          placeholder={copy.placeholder}
          className="h-10 w-full rounded-xl border border-cream-300 bg-cream-50/90 pl-10 pr-10 text-sm font-semibold text-ink-800 shadow-sm outline-none transition-all placeholder:text-ink-500 backdrop-blur focus:border-brand-700 focus:ring-2 focus:ring-brand-100"
        />
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />

        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-500 transition hover:bg-cream-200 hover:text-ink-800"
            aria-label="clear search"
            type="button"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isOpen && query && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-cream-300 bg-cream-50 shadow-xl animate-[fadeIn_0.2s]"
        >
          {filteredNodes.length > 0 ? (
            <div className="max-h-[min(18rem,calc(100dvh-12rem))] overflow-y-auto py-2">
              {filteredNodes.map((node) => {
                const displayImageUrl = node.imageUrl
                  ? resolveDisplayMediaUrl(node.imageUrl)
                  : null;

                return (
                  <button
                    id={`${listboxId}-${node.id}`}
                    role="option"
                    aria-selected={false}
                    key={node.id}
                    onClick={() => {
                      onSelect(node.id);
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-3 border-b border-cream-200 px-4 py-3 text-left transition-colors last:border-0 hover:bg-cream-200"
                    type="button"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cream-200 text-xs font-bold text-ink-500">
                      {displayImageUrl ? (
                        <img
                          src={displayImageUrl}
                          alt={node.label}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        node.label.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-ink-800">
                        {node.label}
                      </div>
                      <div className="text-xs text-ink-500">
                        {resultMeta(node)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-sm font-semibold text-ink-500">
              {copy.notFound(query)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
