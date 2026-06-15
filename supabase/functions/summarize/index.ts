// summarize : génère (et met en cache) un résumé IA d'un item, à partir de son
// titre / auteur / description / tags / transcription.
import { corsHeaders, json } from "../_shared/cors.ts";
import { userClient } from "../_shared/client.ts";
import { callTool } from "../_shared/anthropic.ts";

interface Item {
  id: string;
  type: string;
  platform: string | null;
  title: string;
  author: string | null;
  description: string;
  tags: string[];
  transcript: string | null;
  summary: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { item_id, force } = await req.json();
    if (!item_id) return json({ error: "item_id requis" }, 400);

    const supabase = userClient(req);
    const { data, error } = await supabase
      .from("items")
      .select("id, type, platform, title, author, description, tags, transcript, summary")
      .eq("id", item_id)
      .single();
    if (error || !data) return json({ error: error?.message ?? "Item introuvable" }, 404);

    const item = data as Item;
    if (item.summary && !force) return json({ summary: item.summary });

    const out = await callTool<{ summary: string; takeaways: string[] }>({
      system:
        "Tu résumes une ressource sauvegardée dans Noteflix pour que l'utilisateur " +
        "sache en un coup d'œil ce qu'elle apporte et pourquoi la revoir. Base-toi " +
        "sur le titre, l'auteur, la note personnelle, les tags (et la transcription " +
        "si fournie). Si l'information est limitée, reste prudent et n'invente pas de " +
        "détails factuels précis. Réponds en français.",
      userContent:
        `Titre : ${item.title}\n` +
        `Auteur : ${item.author ?? "—"}\n` +
        `Plateforme : ${item.platform ?? "—"}\n` +
        `Note de l'utilisateur : ${item.description || "—"}\n` +
        `Tags : ${(item.tags ?? []).join(", ") || "—"}\n` +
        `Transcription : ${item.transcript ?? "(non disponible)"}`,
      toolName: "retourner_resume",
      inputSchema: {
        type: "object",
        properties: {
          summary: { type: "string", description: "résumé en 2 à 3 phrases" },
          takeaways: {
            type: "array",
            items: { type: "string" },
            description: "2 à 4 points clés courts",
          },
        },
        required: ["summary", "takeaways"],
      },
    });

    const text =
      out.summary +
      (out.takeaways?.length ? "\n\n• " + out.takeaways.join("\n• ") : "");

    await supabase.from("items").update({ summary: text }).eq("id", item_id);
    return json({ summary: text });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erreur" }, 500);
  }
});
