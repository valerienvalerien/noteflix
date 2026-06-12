"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Category, Item } from "@/lib/db";
import Row from "@/components/Row";
import Card from "@/components/Card";
import PlayerModal from "@/components/PlayerModal";
import AddModal from "@/components/AddModal";
import RecommendModal from "@/components/RecommendModal";

interface SearchResult {
  item: Item;
  reason: string | null;
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [query, setQuery] = useState("");
  const [aiMode, setAiMode] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchSeq = useRef(0);

  const [playing, setPlaying] = useState<Item | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showRecommend, setShowRecommend] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/items");
    const data = await res.json();
    setItems(data.items);
    setCategories(data.categories);
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const runSearch = useCallback(
    async (q: string, ai: boolean) => {
      if (!q.trim()) {
        setResults(null);
        setSearchError(null);
        return;
      }
      const seq = ++searchSeq.current;
      setSearching(true);
      setSearchError(null);
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q.trim(), mode: ai ? "ai" : "local" }),
        });
        const data = await res.json();
        if (seq !== searchSeq.current) return; // stale response
        if (!res.ok) throw new Error(data.error ?? "erreur");
        setResults(data.results);
      } catch (e) {
        if (seq !== searchSeq.current) return;
        setSearchError(e instanceof Error ? e.message : "Erreur de recherche");
        setResults([]);
      } finally {
        if (seq === searchSeq.current) setSearching(false);
      }
    },
    []
  );

  // Instant local search as you type; AI search is triggered explicitly
  useEffect(() => {
    if (aiMode) return;
    const t = setTimeout(() => runSearch(query, false), 200);
    return () => clearTimeout(t);
  }, [query, aiMode, runSearch]);

  const rows = useMemo(() => {
    const byCategory = new Map<string, Item[]>();
    for (const item of items) {
      const key = item.category ?? "Sans catégorie";
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(item);
    }
    return byCategory;
  }, [items]);

  const recent = useMemo(() => items.slice(0, 12), [items]);
  const isSearchView = query.trim().length > 0;

  return (
    <main className="pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-900 bg-zinc-950/90 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-8">
          <h1 className="text-2xl font-black tracking-tight text-red-600 select-none">
            NOTEFLIX
          </h1>

          <div className="order-3 flex w-full items-center gap-2 sm:order-2 sm:ml-6 sm:w-auto sm:flex-1 sm:max-w-xl">
            <div className="relative flex-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && aiMode) runSearch(query, true);
                }}
                placeholder={
                  aiMode
                    ? "Décris ce que tu cherches… (Entrée pour lancer)"
                    : "Recherche instantanée…"
                }
                className="w-full rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 pr-10 text-sm outline-none focus:border-red-500"
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); setResults(null); setSearchError(null); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  aria-label="Effacer"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={() => {
                const next = !aiMode;
                setAiMode(next);
                if (next && query.trim()) runSearch(query, true);
                else if (!next && query.trim()) runSearch(query, false);
              }}
              title="Recherche IA : retrouve un item à partir d'une description vague"
              className={`whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition ${
                aiMode
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              ✨ IA
            </button>
          </div>

          <div className="order-2 ml-auto flex items-center gap-2 sm:order-3">
            <button
              onClick={() => setShowRecommend(true)}
              className="rounded-full bg-zinc-800 px-4 py-2 text-sm font-medium hover:bg-zinc-700"
            >
              ✨ Suggère-moi
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500"
            >
              + Ajouter
            </button>
          </div>
        </div>
      </header>

      {/* Search view */}
      {isSearchView && (
        <section className="px-4 pt-6 sm:px-8">
          <h2 className="mb-3 text-lg font-semibold">
            {aiMode ? "Résultats IA" : "Résultats"}
            {searching && <span className="ml-2 animate-pulse text-sm font-normal text-zinc-400">recherche…</span>}
          </h2>
          {searchError && <p className="mb-4 text-sm text-red-400">{searchError}</p>}
          {aiMode && !results && !searching && !searchError && (
            <p className="text-sm text-zinc-400">
              Décris ce que tu cherches avec tes mots (« la vidéo du gars qui montre un nœud pour la pêche ») puis appuie sur Entrée.
            </p>
          )}
          {results && results.length === 0 && !searching && !searchError && (
            <p className="text-sm text-zinc-400">Aucun résultat. {!aiMode && "Essaie la recherche ✨ IA avec une description plus libre."}</p>
          )}
          <div className="flex flex-wrap gap-4">
            {results?.map(({ item, reason }) => (
              <Card key={item.id} item={item} reason={reason} onOpen={setPlaying} />
            ))}
          </div>
        </section>
      )}

      {/* Library view */}
      {!isSearchView && (
        <div className="pt-6">
          {loaded && items.length === 0 && (
            <div className="mx-auto mt-16 max-w-md px-4 text-center">
              <p className="text-5xl">🎬</p>
              <h2 className="mt-4 text-xl font-bold">Ta bibliothèque est vide</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Colle un lien YouTube, TikTok ou Instagram — ou note une idée. Décris pourquoi tu la
                gardes : c&apos;est ce qui te permettra de la retrouver dans 6 mois en langage naturel.
              </p>
              <button
                onClick={() => setShowAdd(true)}
                className="mt-6 rounded-full bg-red-600 px-6 py-2.5 font-semibold hover:bg-red-500"
              >
                + Ajouter mon premier item
              </button>
            </div>
          )}
          {items.length > 0 && (
            <>
              <Row title="Ajouts récents" items={recent} onOpen={setPlaying} />
              {[...rows.entries()].map(([name, rowItems]) => (
                <Row key={name} title={name} items={rowItems} onOpen={setPlaying} />
              ))}
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {playing && (
        <PlayerModal
          item={playing}
          onClose={() => setPlaying(null)}
          onDelete={async (item) => {
            await fetch(`/api/items/${item.id}`, { method: "DELETE" });
            setPlaying(null);
            setResults((r) => r?.filter((x) => x.item.id !== item.id) ?? null);
            refresh();
          }}
        />
      )}
      {showAdd && (
        <AddModal
          categories={categories}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            refresh();
          }}
        />
      )}
      {showRecommend && (
        <RecommendModal
          onClose={() => setShowRecommend(false)}
          onOpenItem={(item) => {
            setShowRecommend(false);
            setPlaying(item);
          }}
        />
      )}
    </main>
  );
}
