// recommend : suggestions « à revoir » (items existants) et « à explorer »
// (nouveaux contenus à chercher) à partir de la bibliothèque de l'utilisateur.
import { corsHeaders, json } from "../_shared/cors.ts";
import { userClient } from "../_shared/client.ts";
import { callTool, catalog } from "../_shared/anthropic.ts";

interface Row {
  id: string;
  type: string;
  platform: string | null;
  title: string;
  author: string | null;
  description: string;
  tags: string[];
  categories: { name: string } | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { theme } = await req.json().catch(() => ({ theme: null }));

    const supabase = userClient(req);
    const { data, error } = await supabase
      .from("items")
      .select("id, type, platform, title, author, description, tags, categories(name)")
      .order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 400);

    const items = (data as Row[] | null ?? []).map((r) => ({
      ...r,
      category: r.categories?.name ?? null,
    }));

    const out = await callTool<{ suggestions: unknown[] }>({
      system:
        "Tu es le moteur de recommandation de Noteflix. À partir de la " +
        "bibliothèque de l'utilisateur (ses intérêts réels), propose 4 à 6 " +
        "suggestions utiles :\n" +
        "- \"revoir\" : items déjà sauvegardés à revoir maintenant.\n" +
        "- \"explorer\" : nouveaux contenus dans la continuité de ses intérêts, " +
        "avec une URL de recherche YouTube pertinente.\n" +
        "Réponds en français, concret et spécifique, pas générique.",
      userContent: `Bibliothèque :\n${
        items.length ? catalog(items) : "(vide)"
      }\n\n${
        theme
          ? `Thème demandé : "${theme}"`
          : "Pas de thème : surprends-moi avec ce qui est le plus utile."
      }`,
      toolName: "retourner_suggestions",
      inputSchema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                kind: { type: "string", enum: ["revoir", "explorer"] },
                title: { type: "string" },
                reason: { type: "string" },
                item_id: {
                  type: ["string", "null"],
                  description: "id de l'item existant si kind='revoir', sinon null",
                },
                search_url: {
                  type: ["string", "null"],
                  description: "URL de recherche YouTube si kind='explorer', sinon null",
                },
              },
              required: ["kind", "title", "reason", "item_id", "search_url"],
            },
          },
        },
        required: ["suggestions"],
      },
    });

    return json({ suggestions: out.suggestions ?? [] });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erreur" }, 500);
  }
});
