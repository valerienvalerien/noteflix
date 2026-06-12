"use client";

import type { Item } from "@/lib/db";

const PLATFORM_BADGE: Record<string, { label: string; cls: string }> = {
  youtube: { label: "YouTube", cls: "bg-red-600" },
  tiktok: { label: "TikTok", cls: "bg-zinc-100 text-zinc-900" },
  instagram: { label: "Instagram", cls: "bg-gradient-to-r from-purple-600 to-pink-500" },
  other: { label: "Lien", cls: "bg-zinc-700" },
};

const IDEA_GRADIENTS = [
  "from-amber-700 to-rose-800",
  "from-sky-800 to-indigo-900",
  "from-emerald-800 to-teal-900",
  "from-fuchsia-800 to-purple-900",
];

export default function Card({
  item,
  reason,
  onOpen,
}: {
  item: Item;
  reason?: string | null;
  onOpen: (item: Item) => void;
}) {
  const badge = item.type === "idea" ? null : PLATFORM_BADGE[item.platform ?? "other"];
  const gradient = IDEA_GRADIENTS[item.id % IDEA_GRADIENTS.length];

  return (
    <button
      onClick={() => onOpen(item)}
      className="group relative w-44 sm:w-52 shrink-0 text-left transition-transform duration-200 hover:scale-105 hover:z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-lg"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-zinc-800 shadow-lg">
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient} p-3`}
          >
            <span className="line-clamp-3 text-center text-sm font-semibold text-white/90">
              {item.type === "idea" ? "💡 " : "▶ "}
              {item.title}
            </span>
          </div>
        )}
        {badge && (
          <span
            className={`absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${badge.cls}`}
          >
            {badge.label}
          </span>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-zinc-900 text-lg">
            ▶
          </span>
        </div>
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs font-medium text-zinc-200">{item.title}</p>
      {reason && <p className="mt-0.5 line-clamp-2 text-[11px] italic text-emerald-400">✨ {reason}</p>}
    </button>
  );
}
