import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Category, Item } from "../types";
import {
  deleteItem as removeFromDb,
  listCategories,
  listItems,
  setFavorite,
} from "../data";

interface LibraryValue {
  items: Item[];
  categories: Category[];
  loaded: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  // Lecteur
  playing: Item | null;
  openPlayer: (item: Item) => void;
  closePlayer: () => void;
  // Ajout
  showAdd: boolean;
  addUrl: string | null;
  openAdd: (url?: string) => void;
  closeAdd: () => void;
  // Édition
  editing: Item | null;
  openEdit: (item: Item) => void;
  closeEdit: () => void;
  // Collection (catégorie / tag → écran détail)
  collection: { title: string; items: Item[] } | null;
  openCategory: (name: string) => void;
  openTag: (tag: string) => void;
  closeCollection: () => void;
  // Mise à jour locale (après édition / favori)
  replaceItem: (item: Item) => void;
  toggleFavorite: (item: Item) => Promise<void>;
  // Suppression
  removeItem: (item: Item) => Promise<void>;
}

const Ctx = createContext<LibraryValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<Item | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addUrl, setAddUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [collection, setCollection] = useState<{ title: string; items: Item[] } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [its, cats] = await Promise.all([listItems(), listCategories()]);
      setItems(its);
      setCategories(cats);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const removeItem = useCallback(async (item: Item) => {
    await removeFromDb(item.id);
    setPlaying(null);
    setItems((xs) => xs.filter((x) => x.id !== item.id));
  }, []);

  const replaceItem = useCallback((item: Item) => {
    setItems((xs) => xs.map((x) => (x.id === item.id ? item : x)));
    setPlaying((p) => (p && p.id === item.id ? item : p));
  }, []);

  const toggleFavorite = useCallback(async (item: Item) => {
    const next = !item.is_favorite;
    await setFavorite(item.id, next);
    const updated = { ...item, is_favorite: next };
    setItems((xs) => xs.map((x) => (x.id === item.id ? updated : x)));
    setPlaying((p) => (p && p.id === item.id ? updated : p));
  }, []);

  const value: LibraryValue = {
    items,
    categories,
    loaded,
    error,
    refresh,
    playing,
    openPlayer: setPlaying,
    closePlayer: () => setPlaying(null),
    showAdd,
    addUrl,
    openAdd: (url?: string) => {
      setAddUrl(url ?? null);
      setShowAdd(true);
    },
    closeAdd: () => {
      setShowAdd(false);
      setAddUrl(null);
    },
    editing,
    openEdit: (item: Item) => setEditing(item),
    closeEdit: () => setEditing(null),
    collection,
    openCategory: (name: string) =>
      setCollection({
        title: name,
        items: items.filter((i) => (i.category ?? "Sans catégorie") === name),
      }),
    openTag: (tag: string) =>
      setCollection({ title: `#${tag}`, items: items.filter((i) => i.tags.includes(tag)) }),
    closeCollection: () => setCollection(null),
    replaceItem,
    toggleFavorite,
    removeItem,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLibrary(): LibraryValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLibrary doit être utilisé dans <LibraryProvider>");
  return v;
}
