"use client";

import { useEffect, useRef } from "react";
import type { Item } from "@/lib/db";
import { buildEmbedUrl } from "@/lib/video";

export default function PlayerModal({
  item,
  onClose,
  onDelete,
}: {
  item: Item;
  onClose: () => void;
  onDelete: (item: Item) => void;
}) {
  const playerRef = useRef<HTMLDivElement>(null);
  const embedUrl =
    item.type === "video" && item.platform
      ? buildEmbedUrl(item.platform, item.video_id, true)
      : null;

  useEffect(() => {
    // count the view (fire-and-forget)
    fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewed: true }),
    }).catch(() => {});
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item.id, onClose]);

  const goFullscreen = () => {
    playerRef.current?.requestFullscreen?.().catch(() => {});
  };

  const isVertical = item.platform === "tiktok" || item.platform === "instagram";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 fade-up"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-xl bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {embedUrl ? (
          <div
            ref={playerRef}
            className={`relative w-full bg-black ${isVertical ? "mx-auto aspect-[9/16] max-h-[70vh]" : "aspect-video"}`}
          >
            <iframe
              src={embedUrl}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              title={item.title}
            />
          </div>
        ) : item.type === "idea" ? (
          <div className="flex min-h-40 items-center bg-gradient-to-br from-amber-800 to-rose-900 p-8">
            <p className="text-xl font-semibold">💡 {item.title}</p>
          </div>
        ) : (
          <div className="flex min-h-40 flex-col items-center justify-center gap-3 bg-zinc-800 p-8 text-center">
            <p className="text-zinc-300">Lecture intégrée indisponible pour ce lien.</p>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="rounded bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500"
              >
                Ouvrir l&apos;original ↗
              </a>
            )}
          </div>
        )}

        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold">{item.title}</h3>
              <p className="mt-0.5 text-xs text-zinc-400">
                {[item.author, item.category, new Date(item.created_at + "Z").toLocaleDateString("fr-FR")]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-zinc-800 px-3 py-1 text-sm hover:bg-zinc-700"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          {item.description && (
            <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-300">{item.description}</p>
          )}

          {item.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.tags.map((t) => (
                <span key={t} className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300">
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {embedUrl && (
              <button
                onClick={goFullscreen}
                className="rounded bg-zinc-100 px-4 py-1.5 text-sm font-semibold text-zinc-900 hover:bg-white"
              >
                ⛶ Plein écran
              </button>
            )}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="rounded bg-zinc-800 px-4 py-1.5 text-sm hover:bg-zinc-700"
              >
                Ouvrir l&apos;original ↗
              </a>
            )}
            <button
              onClick={() => {
                if (confirm("Supprimer cet item de ta bibliothèque ?")) onDelete(item);
              }}
              className="ml-auto rounded px-3 py-1.5 text-sm text-red-400 hover:bg-red-950/50"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
