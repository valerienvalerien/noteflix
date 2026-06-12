import { NextRequest, NextResponse } from "next/server";
import { listItems } from "@/lib/db";
import { localSearch } from "@/lib/search";
import { aiAvailable, semanticSearch } from "@/lib/ai";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { query, mode } = await req.json();
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "query requise" }, { status: 400 });
  }
  const items = listItems();

  if (mode === "ai") {
    if (!aiAvailable()) {
      return NextResponse.json(
        { error: "Recherche IA indisponible : définis ANTHROPIC_API_KEY côté serveur." },
        { status: 503 }
      );
    }
    try {
      const results = await semanticSearch(query, items);
      const byId = new Map(items.map((i) => [i.id, i]));
      const enriched = results
        .filter((r) => byId.has(r.id))
        .map((r) => ({ item: byId.get(r.id)!, reason: r.reason }));
      return NextResponse.json({ mode: "ai", results: enriched });
    } catch (e) {
      const message = e instanceof Error ? e.message : "erreur IA";
      return NextResponse.json({ error: `Recherche IA en échec : ${message}` }, { status: 502 });
    }
  }

  const results = localSearch(query, items).map((item) => ({ item, reason: null }));
  return NextResponse.json({ mode: "local", results });
}
