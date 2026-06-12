"use client";

import type { Item } from "@/lib/db";
import Card from "./Card";

export default function Row({
  title,
  items,
  onOpen,
}: {
  title: string;
  items: Item[];
  onOpen: (item: Item) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="mb-2 px-4 text-lg font-semibold text-zinc-100 sm:px-8">{title}</h2>
      <div className="row-scroll flex gap-3 overflow-x-auto px-4 pb-2 pt-1 sm:px-8">
        {items.map((item) => (
          <Card key={item.id} item={item} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}
