// index-item : (ré)indexe un item → calcule et stocke son embedding.
// Appelée après chaque création/édition d'item. RLS appliquée via le JWT appelant.
import { corsHeaders, json } from "../_shared/cors.ts";
import { userClient } from "../_shared/client.ts";
import { embed } from "../_shared/embed.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { item_id } = await req.json();
    if (!item_id) return json({ error: "item_id requis" }, 400);

    const supabase = userClient(req);
    const { data: item, error } = await supabase
      .from("items")
      .select("id, title, description, author, tags, transcript")
      .eq("id", item_id)
      .single();
    if (error || !item) return json({ error: error?.message ?? "Item introuvable" }, 404);

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
      .eq("id", item_id);
    if (upErr) return json({ error: upErr.message }, 400);

    return json({ ok: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erreur" }, 500);
  }
});
