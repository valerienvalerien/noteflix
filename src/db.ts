import * as SQLite from "expo-sqlite";
import type { Category, Item, NewItem } from "./types";

const DEFAULT_CATEGORIES = ["Setting & Closing", "Nœuds", "Mandarin", "Idées"];

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync("noteflix.db");
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
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
  const row = await db.getFirstAsync<{ c: number }>("SELECT COUNT(*) AS c FROM categories");
  if (!row || row.c === 0) {
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      await db.runAsync("INSERT INTO categories (name, position) VALUES (?, ?)", [
        DEFAULT_CATEGORIES[i],
        i,
      ]);
    }
  }
  return db;
}

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) dbPromise = open();
  return dbPromise;
}

type ItemRow = Omit<Item, "tags"> & { tags: string };

function rowToItem(row: ItemRow): Item {
  let tags: string[] = [];
  try {
    tags = JSON.parse(row.tags || "[]");
  } catch {
    tags = [];
  }
  return { ...row, tags };
}

export async function listItems(): Promise<Item[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ItemRow>(
    `SELECT i.*, c.name AS category FROM items i
     LEFT JOIN categories c ON c.id = i.category_id
     ORDER BY i.created_at DESC`
  );
  return rows.map(rowToItem);
}

export async function getItem(id: number): Promise<Item | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ItemRow>(
    `SELECT i.*, c.name AS category FROM items i
     LEFT JOIN categories c ON c.id = i.category_id WHERE i.id = ?`,
    [id]
  );
  return row ? rowToItem(row) : null;
}

export async function listCategories(): Promise<Category[]> {
  const db = await getDb();
  return db.getAllAsync<Category>("SELECT * FROM categories ORDER BY position, name");
}

async function ensureCategory(name: string): Promise<number> {
  const db = await getDb();
  const existing = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM categories WHERE name = ? COLLATE NOCASE",
    [name.trim()]
  );
  if (existing) return existing.id;
  const max = await db.getFirstAsync<{ m: number }>(
    "SELECT COALESCE(MAX(position), -1) AS m FROM categories"
  );
  const res = await db.runAsync("INSERT INTO categories (name, position) VALUES (?, ?)", [
    name.trim(),
    (max?.m ?? -1) + 1,
  ]);
  return res.lastInsertRowId;
}

export async function createItem(input: NewItem): Promise<Item> {
  const db = await getDb();
  const categoryId = input.category ? await ensureCategory(input.category) : null;
  const res = await db.runAsync(
    `INSERT INTO items (type, url, platform, video_id, title, description, author, thumbnail, category_id, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.type,
      input.url ?? null,
      input.platform ?? null,
      input.video_id ?? null,
      input.title,
      input.description ?? "",
      input.author ?? null,
      input.thumbnail ?? null,
      categoryId,
      JSON.stringify(input.tags ?? []),
    ]
  );
  return (await getItem(res.lastInsertRowId))!;
}

export async function deleteItem(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM items WHERE id = ?", [id]);
}

export async function markViewed(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE items SET view_count = view_count + 1 WHERE id = ?", [id]);
}
