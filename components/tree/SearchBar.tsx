import { useMemo, useState } from "react";
import { FamilyNode } from "../../lib/types/tree";
import { useLanguage } from "../providers/LanguageProvider";

interface SearchBarProps {
  nodes: FamilyNode[];
  onSelect: (nodeId: string) => void;
}

export default function SearchBar({ nodes, onSelect }: SearchBarProps) {
  const { locale } = useLanguage();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const copy =
    locale === "id"
      ? {
          placeholder: "Cari keluarga...",
          generation: "Generasi",
          notFound: (text: string) =>
            `Tidak ditemukan hasil untuk "${text}"`,
        }
      : {
          placeholder: "Search family...",
          generation: "Generation",
          notFound: (text: string) => `No result found for "${text}"`,
        };

  const filteredNodes = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return nodes.filter((node) =>
      node.label.toLowerCase().includes(lowerQuery)
    );
  }, [nodes, query]);

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={copy.placeholder}
          className="w-full rounded-xl border border-warm-200 bg-white/80 py-2.5 pl-10 pr-4 text-sm text-warmText shadow-sm outline-none transition-all placeholder:text-warmMuted backdrop-blur focus:border-gold-500 focus:ring-2 focus:ring-gold-100"
        />
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warmMuted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-warmMuted/50 hover:text-warmMuted"
            aria-label="clear search"
          >
            ×
          </button>
        )}
      </div>

      {isOpen && query && (
        <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-warm-200 bg-white shadow-xl animate-[fadeIn_0.2s]">
          {filteredNodes.length > 0 ? (
            <div className="max-h-60 overflow-y-auto py-2">
              {filteredNodes.map((node) => (
                <button
                  key={node.id}
                  onClick={() => {
                    onSelect(node.id);
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-3 border-b border-warm-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-warm-100"
                >
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-warm-100 text-xs font-bold text-warmMuted flex items-center justify-center">
                    {node.imageUrl ? (
                      <img
                        src={node.imageUrl}
                        alt={node.label}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      node.label.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-warmText">
                      {node.label}
                    </div>
                    <div className="text-xs text-warmMuted">
                      {copy.generation} {node.generation} • {node.year || "?"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-warmMuted">
              {copy.notFound(query)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
