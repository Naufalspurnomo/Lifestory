import { useState, useMemo } from "react";
import { FamilyNode } from "../../lib/types/tree";

interface SearchBarProps {
  nodes: FamilyNode[];
  onSelect: (nodeId: string) => void;
}

export default function SearchBar({ nodes, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

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
          placeholder="Cari keluarga..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-warm-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-100 transition-all outline-none bg-white/80 backdrop-blur shadow-sm text-sm text-warmText placeholder:text-warmMuted"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-warmMuted w-4 h-4"
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
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && query && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-warm-200 overflow-hidden z-50 animate-[fadeIn_0.2s]">
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
                  className="w-full px-4 py-3 text-left hover:bg-warm-100 transition-colors flex items-center gap-3 border-b border-warm-100 last:border-0"
                >
                  <div className="w-8 h-8 rounded-full bg-warm-100 flex items-center justify-center text-xs font-bold text-warmMuted overflow-hidden shrink-0">
                    {node.imageUrl ? (
                      <img
                        src={node.imageUrl}
                        alt={node.label}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      node.label.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-warmText text-sm">
                      {node.label}
                    </div>
                    <div className="text-xs text-warmMuted">
                      Gen {node.generation} • {node.year || "?"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-warmMuted">
              Tidak ditemukan hasil untuk &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
