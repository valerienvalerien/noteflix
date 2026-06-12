import type { Item } from "./db";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Instant local search: diacritic-insensitive token scoring across all fields.
 * Fast enough for thousands of items; the AI search handles the fuzzy cases.
 */
export function localSearch(query: string, items: Item[]): Item[] {
  const tokens = normalize(query).split(/\s+/).filter((t) => t.length > 1);
  if (tokens.length === 0) return [];

  const scored = items
    .map((item) => {
      const fields: [string, number][] = [
        [item.title, 5],
        [item.description, 4],
        [item.tags.join(" "), 3],
        [item.category ?? "", 2],
        [item.author ?? "", 2],
      ];
      let score = 0;
      for (const token of tokens) {
        for (const [text, weight] of fields) {
          const norm = normalize(text);
          if (!norm) continue;
          if (norm.split(/\W+/).includes(token)) score += weight * 2;
          else if (norm.includes(token)) score += weight;
        }
      }
      return { item, score };
    })
    .filter((s) => s.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.item);
}
