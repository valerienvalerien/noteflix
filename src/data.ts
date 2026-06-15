import { supabase } from "./supabase";
import type {
  Category,
  Item,
  LearningPath,
  NewItem,
  PathStep,
} from "./types";

// --- Mapping ---------------------------------------------------------------

interface ItemRow extends Omit<Item, "category"> {
  categories?: { name: string } | null;
}

function rowToItem(row: ItemRow): Item {
  const { categories, ...rest } = row;
  return { ...rest, category: categories?.name ?? null, tags: rest.tags ?? [] };
}

const ITEM_SELECT =
  "id, type, url, platform, video_id, title, description, author, thumbnail, " +
  "category_id, tags, is_favorite, created_at, view_count, categories(name)";

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Tu dois être connecté.");
  return id;
}

// --- Items -----------------------------------------------------------------

export async function listItems(): Promise<Item[]> {
  const { data, error } = await supabase
    .from("items")
    .select(ITEM_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as ItemRow[]).map(rowToItem);
}

export async function getItem(id: string): Promise<Item | null> {
  const { data, error } = await supabase
    .from("items")
    .select(ITEM_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToItem(data as unknown as ItemRow) : null;
}

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, position")
    .order("position", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return data as Category[];
}

async function ensureCategory(userId: string, name: string): Promise<string> {
  const trimmed = name.trim();
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("name", trimmed)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: maxRow } = await supabase
    .from("categories")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (maxRow?.position ?? -1) + 1;

  const { data: created, error } = await supabase
    .from("categories")
    .insert({ user_id: userId, name: trimmed, position })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}

export async function createItem(input: NewItem): Promise<Item> {
  const userId = await currentUserId();
  const categoryId = input.category ? await ensureCategory(userId, input.category) : null;

  const { data, error } = await supabase
    .from("items")
    .insert({
      user_id: userId,
      type: input.type,
      url: input.url ?? null,
      platform: input.platform ?? null,
      video_id: input.video_id ?? null,
      title: input.title,
      description: input.description ?? "",
      author: input.author ?? null,
      thumbnail: input.thumbnail ?? null,
      category_id: categoryId,
      tags: input.tags ?? [],
    })
    .select(ITEM_SELECT)
    .single();
  if (error) throw error;
  const row = data as unknown as ItemRow;

  // Génère l'embedding en arrière-plan (recherche sémantique). Sans bloquer l'UI.
  supabase.functions
    .invoke("index-item", { body: { item_id: row.id } })
    .catch(() => {});

  return rowToItem(row);
}

export async function updateItem(id: string, input: NewItem): Promise<Item> {
  const userId = await currentUserId();
  const categoryId = input.category ? await ensureCategory(userId, input.category) : null;

  const { data, error } = await supabase
    .from("items")
    .update({
      type: input.type,
      url: input.url ?? null,
      platform: input.platform ?? null,
      video_id: input.video_id ?? null,
      title: input.title,
      description: input.description ?? "",
      author: input.author ?? null,
      thumbnail: input.thumbnail ?? null,
      category_id: categoryId,
      tags: input.tags ?? [],
    })
    .eq("id", id)
    .select(ITEM_SELECT)
    .single();
  if (error) throw error;
  const row = data as unknown as ItemRow;

  // Le texte indexable a pu changer → réindexe l'embedding.
  supabase.functions
    .invoke("index-item", { body: { item_id: row.id } })
    .catch(() => {});

  return rowToItem(row);
}

export async function setFavorite(id: string, value: boolean): Promise<void> {
  const { error } = await supabase
    .from("items")
    .update({ is_favorite: value })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) throw error;
}

export async function markViewed(id: string): Promise<void> {
  const { data } = await supabase
    .from("items")
    .select("view_count")
    .eq("id", id)
    .maybeSingle();
  await supabase
    .from("items")
    .update({ view_count: (data?.view_count ?? 0) + 1 })
    .eq("id", id);
}

// --- IA (Edge Functions) ---------------------------------------------------

export interface AiSearchResult {
  id: string;
  reason: string | null;
}

export async function semanticSearch(query: string): Promise<AiSearchResult[]> {
  const { data, error } = await supabase.functions.invoke("search", {
    body: { query },
  });
  if (error) throw new Error(await readFnError(error));
  return (data?.results ?? []) as AiSearchResult[];
}

export interface Recommendation {
  kind: "revoir" | "explorer";
  title: string;
  reason: string;
  item_id: string | null;
  search_url: string | null;
}

export async function recommend(theme: string | null): Promise<Recommendation[]> {
  const { data, error } = await supabase.functions.invoke("recommend", {
    body: { theme },
  });
  if (error) throw new Error(await readFnError(error));
  return (data?.suggestions ?? []) as Recommendation[];
}

// --- Parcours --------------------------------------------------------------

export async function generatePath(goal: string): Promise<LearningPath> {
  const { data, error } = await supabase.functions.invoke("generate-path", {
    body: { goal },
  });
  if (error) throw new Error(await readFnError(error));
  if (!data?.path) throw new Error("Aucun parcours généré.");
  return data.path as LearningPath;
}

/** Réindexe les embeddings (items sans embedding, ou tous si force=true). */
export async function reindexEmbeddings(force = false): Promise<number> {
  const { data, error } = await supabase.functions.invoke("backfill", {
    body: { force },
  });
  if (error) throw new Error(await readFnError(error));
  return (data?.indexed ?? 0) as number;
}

export async function listPaths(): Promise<LearningPath[]> {
  const { data, error } = await supabase
    .from("paths")
    .select("id, goal, title, steps, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as LearningPath[]).map((p) => ({
    ...p,
    steps: (p.steps ?? []) as PathStep[],
  }));
}

export async function deletePath(id: string): Promise<void> {
  const { error } = await supabase.from("paths").delete().eq("id", id);
  if (error) throw error;
}

/** Les Edge Functions renvoient leurs erreurs dans le corps JSON ; on l'extrait. */
async function readFnError(error: unknown): Promise<string> {
  const ctx = (error as { context?: Response })?.context;
  if (ctx && typeof ctx.json === "function") {
    try {
      const body = await ctx.json();
      if (body?.error) return String(body.error);
    } catch {
      /* ignore */
    }
  }
  return error instanceof Error ? error.message : "Erreur du serveur";
}
