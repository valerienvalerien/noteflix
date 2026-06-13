// search : recherche sémantique en langage naturel.
// 1) embed la requête  2) plus proches voisins (pgvector, RLS)  3) Claude
// re-classe et explique en une phrase. Repli : ordre vectoriel brut.
import { corsHeaders, json } from "../_shared/cors.ts";
import { userClient } from "../_shared/client.ts";
import { embed } from "../_shared/embed.ts";
import { callTool, catalog } from "../_shared/anthropic.ts";

interface Candidate {
  id: string;
  type: string;
  platform: string | null;
  title: string;
  author: string | null;
  description: string;
  tags: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { query, match_count } = await req.json();
    if (!query || !String(query).trim()) return json({ results: [] });

    const supabase = userClient(req);
    const queryEmbedding = await embed(String(query));

    const { data: candidates, error } = await supabase.rpc("match_items", {
      query_embedding: queryEmbedding,
      match_count: match_count ?? 20,
    });
    if (error) return json({ error: error.message }, 400);
    if (!candidates || candidates.length === 0) return json({ results: [] });

    const list = candidates as Candidate[];

    // Re-classement + explication courte par Claude (avec repli robuste).
    try {
      const out = await callTool<{ results: { id: string; reason: string }[] }>({
        system:
          "Tu es le moteur de recherche sémantique de Noteflix, une bibliothèque " +
          "personnelle de vidéos et d'idées. L'utilisateur essaie de RETROUVER " +
          "quelque chose à partir d'une description vague ou approximative. Parmi " +
          "les candidats fournis, garde ceux qui correspondent à l'intention, du " +
          "plus pertinent au moins pertinent. Tolère synonymes et souvenirs flous " +
          "(« le gars qui… »). Ne garde rien si vraiment rien ne colle. Max 10.",
        userContent: `Candidats :\n${catalog(list)}\n\nRequête : "${query}"`,
        toolName: "retourner_resultats",
        inputSchema: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", description: "id de l'item (après #)" },
                  reason: {
                    type: "string",
                    description: "pourquoi ça correspond, une phrase courte en français",
                  },
                },
                required: ["id", "reason"],
              },
            },
          },
          required: ["results"],
        },
      });
      const valid = new Set(list.map((c) => c.id));
      const results = (out.results ?? []).filter((r) => valid.has(r.id));
      return json({ results });
    } catch (_e) {
      // Repli : ordre vectoriel brut, sans explication.
      return json({ results: list.map((c) => ({ id: c.id, reason: null })) });
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erreur" }, 500);
  }
});
