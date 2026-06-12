"use client";

import { useEffect, useState } from "react";
import type { Item } from "@/lib/db";

interface Suggestion {
  kind: "revoir" | "explorer";
  title: string;
  reason: string;
  search_url: string | null;
  item: Item | null;
}

export default function RecommendModal({
  onClose,
  onOpenItem,
}: {
  onClose: () => void;
  onOpenItem: (item: Item) => void;
}) {
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ask = async () => {
    setLoading(true);
    setError(null);
    setSuggestions(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: theme.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "erreur");
      setSuggestions(data.suggestions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 pt-12 fade-up" onClick={onClose}>
      <div className="w-full max-w-xl rounded-xl bg-zinc-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">✨ Recommandations</h3>
          <button onClick={onClose} className="rounded-full bg-zinc-800 px-3 py-1 text-sm hover:bg-zinc-700">✕</button>
        </div>

        <div className="mt-4 flex gap-2">
          <input
            autoFocus
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && ask()}
            placeholder="Un thème ? (optionnel : « nœuds marins », « closing »…)"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-red-500"
          />
          <button
            onClick={ask}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500 disabled:opacity-50"
          >
            {loading ? "Réflexion…" : "Suggère-moi"}
          </button>
        </div>

        {loading && (
          <p className="mt-6 animate-pulse text-center text-sm text-zinc-400">
            Claude analyse ta bibliothèque…
          </p>
        )}
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {suggestions && (
          <div className="mt-5 space-y-3">
            {suggestions.length === 0 && (
              <p className="text-sm text-zinc-400">Rien à suggérer pour l&apos;instant — ajoute quelques items !</p>
            )}
            {suggestions.map((s, i) => (
              <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      s.kind === "revoir" ? "bg-sky-900 text-sky-300" : "bg-emerald-900 text-emerald-300"
                    }`}
                  >
                    {s.kind === "revoir" ? "À revoir" : "À explorer"}
                  </span>
                  <span className="text-sm font-semibold">{s.title}</span>
                </div>
                <p className="mt-1.5 text-xs text-zinc-400">{s.reason}</p>
                <div className="mt-2">
                  {s.kind === "revoir" && s.item && (
                    <button
                      onClick={() => onOpenItem(s.item!)}
                      className="rounded bg-zinc-800 px-3 py-1 text-xs font-medium hover:bg-zinc-700"
                    >
                      ▶ Regarder
                    </button>
                  )}
                  {s.kind === "explorer" && s.search_url && (
                    <a
                      href={s.search_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block rounded bg-zinc-800 px-3 py-1 text-xs font-medium hover:bg-zinc-700"
                    >
                      Chercher sur YouTube ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
