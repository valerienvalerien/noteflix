import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Item } from "./db";

const MODEL = "claude-opus-4-8";

export function aiAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient(): Anthropic {
  return new Anthropic();
}

/** Compact one-line-per-item catalog so Claude can reason over the whole library. */
function catalog(items: Item[]): string {
  return items
    .map((i) => {
      const parts = [
        `#${i.id}`,
        `[${i.type === "idea" ? "idée" : i.platform ?? "vidéo"}]`,
        i.category ? `(${i.category})` : "",
        i.title,
        i.author ? `par ${i.author}` : "",
        i.description ? `— ${i.description}` : "",
        i.tags.length ? `tags: ${i.tags.join(", ")}` : "",
      ];
      return parts.filter(Boolean).join(" ");
    })
    .join("\n");
}

const SearchSchema = z.object({
  results: z.array(
    z.object({
      id: z.number().describe("id de l'item (le nombre après #)"),
      reason: z.string().describe("pourquoi cet item correspond, en une phrase courte en français"),
    })
  ),
});

export type AiSearchResult = z.infer<typeof SearchSchema>["results"];

export async function semanticSearch(query: string, items: Item[]): Promise<AiSearchResult> {
  if (items.length === 0) return [];
  const client = getClient();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    system: `Tu es le moteur de recherche sémantique de Noteflix, une bibliothèque personnelle de vidéos (YouTube, TikTok, Instagram) et d'idées sauvegardées par l'utilisateur.
L'utilisateur essaie de RETROUVER quelque chose qu'il a sauvegardé il y a longtemps, à partir d'une description vague ou approximative en langage naturel.
Retourne les items qui correspondent à l'intention de la requête, classés du plus pertinent au moins pertinent. Sois tolérant : synonymes, thèmes proches, souvenirs imprécis ("le gars qui...", "la vidéo où..."). Ne retourne rien si vraiment rien ne correspond. Maximum 10 résultats.`,
    messages: [
      {
        role: "user",
        content: `Bibliothèque :\n${catalog(items)}\n\nRequête de l'utilisateur : "${query}"`,
      },
    ],
    output_config: { format: zodOutputFormat(SearchSchema) },
  });
  return response.parsed_output?.results ?? [];
}

const RecommendSchema = z.object({
  suggestions: z.array(
    z.object({
      kind: z.enum(["revoir", "explorer"]).describe("'revoir' = item existant de la bibliothèque, 'explorer' = nouveau contenu à découvrir"),
      title: z.string(),
      reason: z.string().describe("pourquoi cette suggestion, en français, une ou deux phrases"),
      item_id: z.number().nullable().describe("id de l'item existant si kind='revoir', sinon null"),
      search_url: z
        .string()
        .nullable()
        .describe("si kind='explorer' : une URL de recherche YouTube (https://www.youtube.com/results?search_query=...), sinon null"),
    })
  ),
});

export type Recommendation = z.infer<typeof RecommendSchema>["suggestions"][number];

export async function recommend(theme: string | null, items: Item[]): Promise<Recommendation[]> {
  const client = getClient();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    system: `Tu es le moteur de recommandation de Noteflix, la bibliothèque personnelle de vidéos et d'idées de l'utilisateur.
À partir de sa bibliothèque (ses centres d'intérêt réels), propose 4 à 6 suggestions utiles :
- "revoir" : des items déjà sauvegardés qui méritent d'être revus maintenant (en lien avec le thème demandé, ou oubliés depuis longtemps).
- "explorer" : des idées de nouveaux contenus dans la continuité de ses intérêts (sujets précis, créateurs, techniques), avec une URL de recherche YouTube pertinente.
Réponds en français. Sois concret et spécifique, pas générique.`,
    messages: [
      {
        role: "user",
        content: `Bibliothèque :\n${items.length ? catalog(items) : "(vide)"}\n\n${
          theme ? `Thème demandé : "${theme}"` : "Pas de thème particulier : surprends-moi avec ce qui est le plus utile."
        }`,
      },
    ],
    output_config: { format: zodOutputFormat(RecommendSchema) },
  });
  return response.parsed_output?.suggestions ?? [];
}
