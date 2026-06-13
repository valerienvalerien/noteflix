import type { Item } from "./types";
import { getApiKey } from "./apiKey";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-4-8";

export interface AiSearchResult {
  id: number;
  reason: string;
}

export interface Recommendation {
  kind: "revoir" | "explorer";
  title: string;
  reason: string;
  item_id: number | null;
  search_url: string | null;
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

interface ToolUseBlock {
  type: string;
  name?: string;
  input?: unknown;
}

/**
 * Calls Claude's Messages API directly and forces a single tool call so the
 * model returns structured JSON. Throws a readable error on failure.
 */
async function callTool<T>(body: {
  system: string;
  userContent: string;
  toolName: string;
  inputSchema: Record<string, unknown>;
}): Promise<T> {
  const key = await getApiKey();
  if (!key) {
    throw new Error("Aucune clé API. Ajoute ta clé Anthropic dans les Réglages (⚙).");
  }

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      system: body.system,
      messages: [{ role: "user", content: body.userContent }],
      tools: [
        {
          name: body.toolName,
          description: "Retourne le résultat structuré.",
          input_schema: body.inputSchema,
        },
      ],
      tool_choice: { type: "tool", name: body.toolName },
    }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const err = await res.json();
      detail = err?.error?.message ?? JSON.stringify(err);
    } catch {
      detail = await res.text().catch(() => "");
    }
    if (res.status === 401) throw new Error("Clé API invalide (401). Vérifie-la dans les Réglages.");
    throw new Error(`Erreur Claude ${res.status} : ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as { content?: ToolUseBlock[] };
  const block = data.content?.find((b) => b.type === "tool_use" && b.name === body.toolName);
  if (!block || block.input == null) {
    throw new Error("Réponse inattendue de Claude (pas de sortie structurée).");
  }
  return block.input as T;
}

export async function semanticSearch(query: string, items: Item[]): Promise<AiSearchResult[]> {
  if (items.length === 0) return [];
  const result = await callTool<{ results: AiSearchResult[] }>({
    system: `Tu es le moteur de recherche sémantique de Noteflix, une bibliothèque personnelle de vidéos (YouTube, TikTok, Instagram) et d'idées sauvegardées par l'utilisateur.
L'utilisateur essaie de RETROUVER quelque chose qu'il a sauvegardé il y a longtemps, à partir d'une description vague ou approximative en langage naturel.
Retourne les items qui correspondent à l'intention de la requête, classés du plus pertinent au moins pertinent. Sois tolérant : synonymes, thèmes proches, souvenirs imprécis ("le gars qui...", "la vidéo où..."). Ne retourne rien si vraiment rien ne correspond. Maximum 10 résultats.`,
    userContent: `Bibliothèque :\n${catalog(items)}\n\nRequête de l'utilisateur : "${query}"`,
    toolName: "retourner_resultats",
    inputSchema: {
      type: "object",
      properties: {
        results: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number", description: "id de l'item (le nombre après #)" },
              reason: {
                type: "string",
                description: "pourquoi cet item correspond, en une phrase courte en français",
              },
            },
            required: ["id", "reason"],
          },
        },
      },
      required: ["results"],
    },
  });
  return result.results ?? [];
}

export async function recommend(theme: string | null, items: Item[]): Promise<Recommendation[]> {
  const result = await callTool<{ suggestions: Recommendation[] }>({
    system: `Tu es le moteur de recommandation de Noteflix, la bibliothèque personnelle de vidéos et d'idées de l'utilisateur.
À partir de sa bibliothèque (ses centres d'intérêt réels), propose 4 à 6 suggestions utiles :
- "revoir" : des items déjà sauvegardés qui méritent d'être revus maintenant (en lien avec le thème demandé, ou oubliés depuis longtemps).
- "explorer" : des idées de nouveaux contenus dans la continuité de ses intérêts (sujets précis, créateurs, techniques), avec une URL de recherche YouTube pertinente.
Réponds en français. Sois concret et spécifique, pas générique.`,
    userContent: `Bibliothèque :\n${items.length ? catalog(items) : "(vide)"}\n\n${
      theme
        ? `Thème demandé : "${theme}"`
        : "Pas de thème particulier : surprends-moi avec ce qui est le plus utile."
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
              kind: {
                type: "string",
                enum: ["revoir", "explorer"],
                description:
                  "'revoir' = item existant de la bibliothèque, 'explorer' = nouveau contenu à découvrir",
              },
              title: { type: "string" },
              reason: {
                type: "string",
                description: "pourquoi cette suggestion, en français, une ou deux phrases",
              },
              item_id: {
                type: ["number", "null"],
                description: "id de l'item existant si kind='revoir', sinon null",
              },
              search_url: {
                type: ["string", "null"],
                description:
                  "si kind='explorer' : une URL de recherche YouTube (https://www.youtube.com/results?search_query=...), sinon null",
              },
            },
            required: ["kind", "title", "reason", "item_id", "search_url"],
          },
        },
      },
      required: ["suggestions"],
    },
  });
  return result.suggestions ?? [];
}
