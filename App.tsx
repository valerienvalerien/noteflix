import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import type { Category, Item } from "./src/types";
import { listCategories, listItems, deleteItem } from "./src/db";
import { localSearch } from "./src/search";
import { semanticSearch } from "./src/ai";
import { hasApiKey } from "./src/apiKey";
import { colors } from "./src/theme";
import Card from "./src/components/Card";
import Row from "./src/components/Row";
import PlayerModal from "./src/components/PlayerModal";
import AddModal from "./src/components/AddModal";
import RecommendModal from "./src/components/RecommendModal";
import SettingsModal from "./src/components/SettingsModal";

interface SearchResult {
  item: Item;
  reason: string | null;
}

const TOP_PAD = Platform.OS === "android" ? (RNStatusBar.currentHeight ?? 24) + 8 : 56;

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [query, setQuery] = useState("");
  const [aiMode, setAiMode] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchSeq = useRef(0);

  const [keyConfigured, setKeyConfigured] = useState(false);
  const [playing, setPlaying] = useState<Item | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showRecommend, setShowRecommend] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const refresh = useCallback(async () => {
    const [its, cats] = await Promise.all([listItems(), listCategories()]);
    setItems(its);
    setCategories(cats);
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
    hasApiKey().then(setKeyConfigured);
  }, [refresh]);

  const runSearch = useCallback(
    async (q: string, ai: boolean, allItems: Item[]) => {
      if (!q.trim()) {
        setResults(null);
        setSearchError(null);
        return;
      }
      const seq = ++searchSeq.current;
      setSearching(true);
      setSearchError(null);
      try {
        if (ai) {
          const matches = await semanticSearch(q.trim(), allItems);
          if (seq !== searchSeq.current) return;
          const byId = new Map(allItems.map((i) => [i.id, i]));
          setResults(
            matches
              .filter((m) => byId.has(m.id))
              .map((m) => ({ item: byId.get(m.id)!, reason: m.reason }))
          );
        } else {
          const matches = localSearch(q, allItems);
          if (seq !== searchSeq.current) return;
          setResults(matches.map((item) => ({ item, reason: null })));
        }
      } catch (e) {
        if (seq !== searchSeq.current) return;
        setSearchError(e instanceof Error ? e.message : "Erreur de recherche");
        setResults([]);
      } finally {
        if (seq === searchSeq.current) setSearching(false);
      }
    },
    []
  );

  // Instant local search as you type; AI search is triggered explicitly.
  useEffect(() => {
    if (aiMode) return;
    const t = setTimeout(() => runSearch(query, false, items), 200);
    return () => clearTimeout(t);
  }, [query, aiMode, items, runSearch]);

  const toggleAi = () => {
    const next = !aiMode;
    if (next && !keyConfigured) {
      setShowSettings(true);
      return;
    }
    setAiMode(next);
    if (next && query.trim()) runSearch(query, true, items);
    else if (!next && query.trim()) runSearch(query, false, items);
  };

  const rows = useMemo(() => {
    const byCategory = new Map<string, Item[]>();
    for (const item of items) {
      const key = item.category ?? "Sans catégorie";
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(item);
    }
    return byCategory;
  }, [items]);

  const recent = useMemo(() => items.slice(0, 12), [items]);
  const isSearchView = query.trim().length > 0;

  const onDelete = async (item: Item) => {
    await deleteItem(item.id);
    setPlaying(null);
    setResults((r) => r?.filter((x) => x.item.id !== item.id) ?? null);
    refresh();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: TOP_PAD }]}>
        <View style={styles.headerTop}>
          <Text style={styles.logo}>NOTEFLIX</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} onPress={() => setShowRecommend(true)}>
              <Text style={styles.iconBtnText}>✨ Suggère-moi</Text>
            </Pressable>
            <Pressable style={styles.gearBtn} onPress={() => setShowSettings(true)}>
              <Text style={styles.gearText}>⚙</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => aiMode && runSearch(query, true, items)}
              placeholder={aiMode ? "Décris ce que tu cherches…" : "Recherche instantanée…"}
              placeholderTextColor={colors.textFaint}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {query ? (
              <Pressable
                style={styles.clearBtn}
                onPress={() => {
                  setQuery("");
                  setResults(null);
                  setSearchError(null);
                }}
              >
                <Text style={styles.clearText}>✕</Text>
              </Pressable>
            ) : null}
          </View>
          <Pressable
            style={[styles.aiToggle, aiMode && styles.aiToggleActive]}
            onPress={toggleAi}
          >
            <Text style={[styles.aiToggleText, aiMode && styles.aiToggleTextActive]}>✨ IA</Text>
          </Pressable>
          <Pressable style={styles.addBtn} onPress={() => setShowAdd(true)}>
            <Text style={styles.addBtnText}>+</Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      {isSearchView ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.resultsHead}>
            <Text style={styles.sectionTitle}>{aiMode ? "Résultats IA" : "Résultats"}</Text>
            {searching ? <ActivityIndicator color={colors.textMuted} style={{ marginLeft: 10 }} /> : null}
          </View>
          {searchError ? <Text style={styles.error}>{searchError}</Text> : null}
          {aiMode && !results && !searching && !searchError ? (
            <Text style={styles.muted}>
              Décris ce que tu cherches avec tes mots (« la vidéo du gars qui montre un nœud pour la
              pêche ») puis valide.
            </Text>
          ) : null}
          {results && results.length === 0 && !searching && !searchError ? (
            <Text style={styles.muted}>
              Aucun résultat.{!aiMode ? " Essaie la recherche ✨ IA avec une description plus libre." : ""}
            </Text>
          ) : null}
          <View style={styles.grid}>
            {results?.map(({ item, reason }) => (
              <Card key={item.id} item={item} reason={reason} onOpen={setPlaying} />
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {loaded && items.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🎬</Text>
              <Text style={styles.emptyTitle}>Ta bibliothèque est vide</Text>
              <Text style={styles.emptyText}>
                Colle un lien YouTube, TikTok ou Instagram — ou note une idée. Décris pourquoi tu la
                gardes : c'est ce qui te permettra de la retrouver dans 6 mois en langage naturel.
              </Text>
              <Pressable style={styles.emptyBtn} onPress={() => setShowAdd(true)}>
                <Text style={styles.emptyBtnText}>+ Ajouter mon premier item</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Row title="Ajouts récents" items={recent} onOpen={setPlaying} />
              {[...rows.entries()].map(([name, rowItems]) => (
                <Row key={name} title={name} items={rowItems} onOpen={setPlaying} />
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* Modals */}
      {playing ? (
        <PlayerModal item={playing} onClose={() => setPlaying(null)} onDelete={onDelete} />
      ) : null}
      {showAdd ? (
        <AddModal
          categories={categories}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            refresh();
          }}
        />
      ) : null}
      {showRecommend ? (
        <RecommendModal
          items={items}
          onClose={() => setShowRecommend(false)}
          onOpenItem={(item) => {
            setShowRecommend(false);
            setPlaying(item);
          }}
        />
      ) : null}
      {showSettings ? (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onSaved={() => hasApiKey().then(setKeyConfigured)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logo: { color: colors.red, fontSize: 22, fontWeight: "900", letterSpacing: 0.5 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { backgroundColor: colors.surfaceAlt, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  iconBtnText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  gearBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  gearText: { color: colors.text, fontSize: 16 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  searchInputWrap: { flex: 1, justifyContent: "center" },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    paddingRight: 36,
    color: colors.text,
    fontSize: 14,
  },
  clearBtn: { position: "absolute", right: 12 },
  clearText: { color: colors.textFaint, fontSize: 14 },
  aiToggle: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  aiToggleActive: { backgroundColor: colors.emerald },
  aiToggleText: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  aiToggleTextActive: { color: "#fff" },
  addBtn: {
    backgroundColor: colors.red,
    borderRadius: 999,
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontSize: 22, fontWeight: "700", marginTop: -2 },
  content: { paddingTop: 18, paddingBottom: 40 },
  resultsHead: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  error: { color: "#f87171", fontSize: 13, paddingHorizontal: 16, marginBottom: 10 },
  muted: { color: colors.textMuted, fontSize: 13, paddingHorizontal: 16, lineHeight: 19 },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, paddingTop: 4 },
  empty: { alignItems: "center", marginTop: 64, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: "700", marginTop: 16 },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 },
  emptyBtn: {
    marginTop: 24,
    backgroundColor: colors.red,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 11,
  },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
