// Appels Claude côté serveur. La clé Anthropic vit dans le secret Supabase
// `ANTHROPIC_API_KEY` (jamais sur l'appareil).
//
// On force un unique tool_use pour obtenir une sortie JSON structurée — pattern
// éprouvé, repris de l'ancien `src/ai.ts`. Modèle : claude-opus-4-8.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-4-8";

/** Vrai si une clé Anthropic est configurée (secret Supabase). */
export function aiEnabled(): boolean {
  return !!Deno.env.get("ANTHROPIC_API_KEY");
}

interface ToolUseBlock {
  type: string;
  name?: string;
  input?: unknown;
}

export async function callTool<T>(opts: {
  system: string;
  userContent: string;
  toolName: string;
  inputSchema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<T> {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) throw new Error("ANTHROPIC_API_KEY manquant (secret Supabase).");

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 4000,
      system: opts.system,
      messages: [{ role: "user", content: opts.userContent }],
      tools: [
        {
          name: opts.toolName,
          description: "Retourne le résultat structuré.",
          input_schema: opts.inputSchema,
        },
      ],
      tool_choice: { type: "tool", name: opts.toolName },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Claude ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as { content?: ToolUseBlock[] };
  const block = data.content?.find(
    (b) => b.type === "tool_use" && b.name === opts.toolName,
  );
  if (!block || block.input == null) {
    throw new Error("Réponse Claude inattendue (pas de sortie structurée).");
  }
  return block.input as T;
}

/** Catalogue compact (une ligne par item) pour que Claude raisonne sur la sélection. */
export function catalog(
  items: Array<{
    id: string;
    type: string;
    platform: string | null;
    category?: string | null;
    title: string;
    author: string | null;
    description: string;
    tags: string[];
  }>,
): string {
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
