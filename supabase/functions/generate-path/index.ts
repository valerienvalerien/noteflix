// generate-path : construit un parcours d'apprentissage à partir d'un objectif
// (« apprendre le closing en 30 jours ») et de la bibliothèque de l'utilisateur.
import { corsHeaders, json } from "../_shared/cors.ts";
import { userClient } from "../_shared/client.ts";
import { embed } from "../_shared/embed.ts";
import { aiEnabled, callTool, catalog } from "../_shared/anthropic.ts";

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
    if (!aiEnabled()) return json({ ai_disabled: true });
    const { goal } = await req.json();
    if (!goal || !String(goal).trim()) return json({ error: "goal requis" }, 400);

    const supabase = userClient(req);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return json({ error: "Non authentifié" }, 401);

    // Items les plus pertinents pour l'objectif.
    const goalEmbedding = await embed(String(goal));
    const { data: candidates, error } = await supabase.rpc("match_items", {
      query_embedding: goalEmbedding,
      match_count: 40,
    });
    if (error) return json({ error: error.message }, 400);

    const list = (candidates as Candidate[] | null) ?? [];
    if (list.length === 0) {
      return json({ error: "Bibliothèque vide ou non indexée." }, 400);
    }

    const out = await callTool<{
      title: string;
      steps: { day: number; item_id: string; title: string; why: string }[];
    }>({
      system:
        "Tu es le coach de Noteflix. À partir de l'objectif de l'utilisateur et " +
        "des vidéos/idées de SA bibliothèque (fournies), construis un parcours " +
        "d'apprentissage progressif et réaliste. Chaque étape référence UN item " +
        "existant par son id (jamais inventé) avec une raison concrète. Ordonne " +
        "du fondamental à l'avancé. 5 à 15 étapes. Réponds en français.",
      userContent: `Objectif : "${goal}"\n\nBibliothèque disponible :\n${catalog(list)}`,
      toolName: "retourner_parcours",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "titre court et motivant du parcours" },
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "number", description: "numéro d'étape (1, 2, 3…)" },
                item_id: { type: "string", description: "id d'un item fourni (après #)" },
                title: { type: "string", description: "ce que l'utilisateur fait à cette étape" },
                why: { type: "string", description: "pourquoi, en une phrase" },
              },
              required: ["day", "item_id", "title", "why"],
            },
          },
        },
        required: ["title", "steps"],
      },
    });

    const valid = new Set(list.map((c) => c.id));
    const steps = (out.steps ?? []).filter((s) => valid.has(s.item_id));

    const { data: path, error: insErr } = await supabase
      .from("paths")
      .insert({ user_id: userId, goal: String(goal).trim(), title: out.title, steps })
      .select()
      .single();
    if (insErr) return json({ error: insErr.message }, 400);

    return json({ path });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erreur" }, 500);
  }
});
