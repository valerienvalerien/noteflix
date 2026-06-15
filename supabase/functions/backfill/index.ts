// backfill : (ré)indexe les items de l'utilisateur. Par défaut, seuls ceux sans
// embedding ; avec { force: true }, tous (utile si on change de modèle d'embeddings).
import { corsHeaders, json } from "../_shared/cors.ts";
import { userClient } from "../_shared/client.ts";
import { embed } from "../_shared/embed.ts";

interface Row {
  id: string;
  title: string;
  description: string;
  author: string | null;
  tags: string[];
  transcript: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { force } = await req.json().catch(() => ({ force: false }));

    const supabase = userClient(req);
    let query = supabase
      .from("items")
      .select("id, title, description, author, tags, transcript");
    if (!force) query = query.is("embedding", null);
    const { data, error } = await query.limit(200);
    if (error) return json({ error: error.message }, 400);

    const rows = (data as Row[] | null) ?? [];
    let indexed = 0;
    for (const item of rows) {
      const text = [
        item.title,
        item.description,
        item.author,
        (item.tags ?? []).join(" "),
        item.transcript,
      ]
        .filter(Boolean)
        .join("\n");
      const embedding = await embed(text);
      const { error: upErr } = await supabase
        .from("items")
        .update({ embedding })
        .eq("id", item.id);
      if (!upErr) indexed++;
    }

    return json({ ok: true, indexed, total: rows.length });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erreur" }, 500);
  }
});
