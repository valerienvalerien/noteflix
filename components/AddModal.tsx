"use client";

import { useEffect, useState } from "react";
import type { Category, Item, Platform } from "@/lib/db";

interface Meta {
  platform: Platform;
  video_id: string | null;
  url: string;
  title: string | null;
  author: string | null;
  thumbnail: string | null;
}

export default function AddModal({
  categories,
  onClose,
  onCreated,
}: {
  categories: Category[];
  onClose: () => void;
  onCreated: (item: Item) => void;
}) {
  const [mode, setMode] = useState<"video" | "idea">("video");
  const [url, setUrl] = useState("");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Auto-fetch metadata after the user pastes/edits a URL
  useEffect(() => {
    if (mode !== "video" || !url.trim().startsWith("http")) return;
    const t = setTimeout(async () => {
      setFetchingMeta(true);
      setError(null);
      try {
        const res = await fetch("/api/metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });
        const data = await res.json();
        if (res.ok) {
          setMeta(data);
          if (data.title && !title) setTitle(data.title);
        }
      } catch {
        // best-effort
      } finally {
        setFetchingMeta(false);
      }
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, mode]);

  const submit = async () => {
    if (!title.trim()) {
      setError("Donne un titre.");
      return;
    }
    setSaving(true);
    setError(null);
    const chosenCategory = newCategory.trim() || category || null;
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: mode,
          url: mode === "video" ? (meta?.url ?? url.trim() ?? null) : null,
          platform: mode === "video" ? (meta?.platform ?? null) : null,
          video_id: mode === "video" ? (meta?.video_id ?? null) : null,
          title: title.trim(),
          description,
          author: meta?.author ?? null,
          thumbnail: mode === "video" ? (meta?.thumbnail ?? null) : null,
          category: chosenCategory,
          tags: tags
            .split(",")
            .map((t) => t.trim().replace(/^#/, ""))
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "erreur");
      onCreated(data.item);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur à l'enregistrement");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 pt-12 fade-up" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-zinc-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Ajouter à ma bibliothèque</h3>
          <button onClick={onClose} className="rounded-full bg-zinc-800 px-3 py-1 text-sm hover:bg-zinc-700">✕</button>
        </div>

        <div className="mt-4 flex gap-2">
          {(["video", "idea"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                mode === m ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {m === "video" ? "🎬 Vidéo" : "💡 Idée"}
            </button>
          ))}
        </div>

        {mode === "video" && (
          <div className="mt-4">
            <label className="text-xs font-medium text-zinc-400">Lien YouTube / Shorts / TikTok / Instagram</label>
            <input
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Colle l'URL ici…"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-red-500"
            />
            {fetchingMeta && <p className="mt-1 text-xs text-zinc-500">Récupération des infos…</p>}
            {meta?.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={meta.thumbnail} alt="" className="mt-2 h-28 rounded-lg object-cover" />
            )}
          </div>
        )}

        <div className="mt-4">
          <label className="text-xs font-medium text-zinc-400">Titre</label>
          <input
            autoFocus={mode === "idea"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={mode === "idea" ? "Mon idée en une phrase" : "Titre de la vidéo"}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-red-500"
          />
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-zinc-400">
            Pourquoi tu la gardes ? <span className="text-zinc-500">(c&apos;est ce qui te permettra de la retrouver dans 6 mois)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Ex : le youtubeur qui explique le nœud de chaise avec l'astuce du serpent, super clair…"
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-red-500"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-zinc-400">Catégorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-red-500"
            >
              <option value="">— Aucune —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400">…ou nouvelle catégorie</label>
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Ex : Cuisine"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-zinc-400">Tags (séparés par des virgules)</label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="closing, objection, script"
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-red-500"
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <button
          onClick={submit}
          disabled={saving}
          className="mt-5 w-full rounded-lg bg-red-600 py-2.5 font-semibold hover:bg-red-500 disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
