import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Category, Item } from "../types";
import { deleteItem as removeFromDb, listCategories, listItems } from "../data";

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
    removeItem,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLibrary(): LibraryValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLibrary doit être utilisé dans <LibraryProvider>");
  return v;
}
