import { NextRequest, NextResponse } from "next/server";
import { listItems } from "@/lib/db";
import { aiAvailable, recommend } from "@/lib/ai";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  if (!aiAvailable()) {
    return NextResponse.json(
      { error: "Recommandations indisponibles : définis ANTHROPIC_API_KEY côté serveur." },
      { status: 503 }
    );
  }
  const { theme } = await req.json().catch(() => ({ theme: null }));
  try {
    const items = listItems();
    const suggestions = await recommend(theme || null, items);
    const byId = new Map(items.map((i) => [i.id, i]));
    const enriched = suggestions.map((s) => ({
      ...s,
      item: s.item_id != null ? byId.get(s.item_id) ?? null : null,
    }));
    return NextResponse.json({ suggestions: enriched });
  } catch (e) {
    const message = e instanceof Error ? e.message : "erreur IA";
    return NextResponse.json({ error: `Recommandation en échec : ${message}` }, { status: 502 });
  }
}
