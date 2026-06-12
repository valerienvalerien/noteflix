import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

export type Platform = "youtube" | "tiktok" | "instagram" | "other";

export interface Item {
  id: number;
  type: "video" | "idea";
  url: string | null;
  platform: Platform | null;
  video_id: string | null;
  title: string;
  description: string;
  author: string | null;
  thumbnail: string | null;
  category_id: number | null;
  category?: string | null;
  tags: string[];
  created_at: string;
  view_count: number;
}

export interface Category {
  id: number;
  name: string;
  position: number;
}

const DATA_DIR = path.join(process.cwd(), "data");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new Database(path.join(DATA_DIR, "noteflix.db"));
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      position INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL DEFAULT 'video',
      url TEXT,
      platform TEXT,
      video_id TEXT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      author TEXT,
      thumbnail TEXT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      view_count INTEGER NOT NULL DEFAULT 0
    );
  `);
  const count = (db.prepare("SELECT COUNT(*) AS c FROM categories").get() as { c: number }).c;
  if (count === 0) {
    const ins = db.prepare("INSERT INTO categories (name, position) VALUES (?, ?)");
    ["Setting & Closing", "Nœuds", "Mandarin", "Idées"].forEach((name, i) => ins.run(name, i));
  }
  return db;
}

function rowToItem(row: Record<string, unknown>): Item {
  return {
    ...(row as unknown as Item),
    tags: JSON.parse((row.tags as string) || "[]"),
  };
}

export function listItems(): Item[] {
  const rows = getDb()
    .prepare(
      `SELECT i.*, c.name AS category FROM items i
       LEFT JOIN categories c ON c.id = i.category_id
       ORDER BY i.created_at DESC`
    )
    .all() as Record<string, unknown>[];
  return rows.map(rowToItem);
}

export function getItem(id: number): Item | null {
  const row = getDb()
    .prepare(
      `SELECT i.*, c.name AS category FROM items i
       LEFT JOIN categories c ON c.id = i.category_id WHERE i.id = ?`
    )
    .get(id) as Record<string, unknown> | undefined;
  return row ? rowToItem(row) : null;
}

export function listCategories(): Category[] {
  return getDb().prepare("SELECT * FROM categories ORDER BY position, name").all() as Category[];
}

export function ensureCategory(name: string): number {
  const d = getDb();
  const existing = d.prepare("SELECT id FROM categories WHERE name = ? COLLATE NOCASE").get(name.trim()) as
    | { id: number }
    | undefined;
  if (existing) return existing.id;
  const max = (d.prepare("SELECT COALESCE(MAX(position), -1) AS m FROM categories").get() as { m: number }).m;
  const res = d.prepare("INSERT INTO categories (name, position) VALUES (?, ?)").run(name.trim(), max + 1);
  return Number(res.lastInsertRowid);
}

export interface NewItem {
  type: "video" | "idea";
  url?: string | null;
  platform?: Platform | null;
  video_id?: string | null;
  title: string;
  description?: string;
  author?: string | null;
  thumbnail?: string | null;
  category?: string | null;
  tags?: string[];
}

export function createItem(input: NewItem): Item {
  const d = getDb();
  const categoryId = input.category ? ensureCategory(input.category) : null;
  const res = d
    .prepare(
      `INSERT INTO items (type, url, platform, video_id, title, description, author, thumbnail, category_id, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.type,
      input.url ?? null,
      input.platform ?? null,
      input.video_id ?? null,
      input.title,
      input.description ?? "",
      input.author ?? null,
      input.thumbnail ?? null,
      categoryId,
      JSON.stringify(input.tags ?? [])
    );
  return getItem(Number(res.lastInsertRowid))!;
}

export function updateItem(id: number, patch: Partial<NewItem>): Item | null {
  const current = getItem(id);
  if (!current) return null;
  const categoryId =
    patch.category !== undefined
      ? patch.category
        ? ensureCategory(patch.category)
        : null
      : current.category_id;
  getDb()
    .prepare(
      `UPDATE items SET title = ?, description = ?, category_id = ?, tags = ? WHERE id = ?`
    )
    .run(
      patch.title ?? current.title,
      patch.description ?? current.description,
      categoryId,
      JSON.stringify(patch.tags ?? current.tags),
      id
    );
  return getItem(id);
}

export function deleteItem(id: number): void {
  getDb().prepare("DELETE FROM items WHERE id = ?").run(id);
}

export function markViewed(id: number): void {
  getDb().prepare("UPDATE items SET view_count = view_count + 1 WHERE id = ?").run(id);
}
