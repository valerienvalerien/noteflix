import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Item } from "../types";
import { localSearch } from "../search";
import { semanticSearch } from "../data";
import { useLibrary } from "../library/LibraryContext";
import { colors } from "../theme";
import Card from "../components/Card";

interface Result {
  item: Item;
  reason: string | null;
}

export default function SearchScreen() {
  const { items, openPlayer } = useLibrary();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [aiMode, setAiMode] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  // Recherche instantanée locale pendant la frappe (mode non-IA).
  useEffect(() => {
    if (aiMode) return;
    const t = setTimeout(() => {
      if (!query.trim()) {
        setResults(null);
        return;
      }
      setResults(localSearch(query, items).map((item) => ({ item, reason: null })));
    }, 150);
    return () => clearTimeout(t);
  }, [query, aiMode, items]);

  const runAi = async () => {
    if (!query.trim()) return;
    const s = ++seq.current;
    setSearching(true);
    setError(null);
    try {
      const matches = await semanticSearch(query.trim());
      if (s !== seq.current) return;
      const byId = new Map(items.map((i) => [i.id, i]));
      setResults(
        matches
          .filter((m) => byId.has(m.id))
          .map((m) => ({ item: byId.get(m.id)!, reason: m.reason })),
      );
    } catch (e) {
      if (s !== seq.current) return;
      setError(e instanceof Error ? e.message : "Erreur de recherche");
      setResults([]);
    } finally {
      if (s === seq.current) setSearching(false);
    }
  };

  const toggleAi = () => {
    const next = !aiMode;
    setAiMode(next);
    setResults(null);
    setError(null);
    if (next && query.trim()) runAi();
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.heading}>Recherche</Text>
        <View style={styles.searchRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => aiMode && runAi()}
            placeholder={aiMode ? "Décris ce que tu cherches…" : "Recherche instantanée…"}
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            returnKeyType="search"
            autoCorrect={false}
          />
          <Pressable
            style={[styles.aiToggle, aiMode && styles.aiToggleActive]}
            onPress={toggleAi}
          >
            <Text style={[styles.aiText, aiMode && styles.aiTextActive]}>✨ IA</Text>
          </Pressable>
        </View>
        {aiMode ? (
          <Text style={styles.hint}>
            La recherche IA comprend les descriptions floues (« le gars qui montre un nœud pour la
            pêche »). Valide pour lancer.
          </Text>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {searching ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.textMuted} />
            <Text style={styles.muted}>Recherche sémantique…</Text>
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {results && results.length === 0 && !searching ? (
          <Text style={styles.muted}>
            Aucun résultat.{!aiMode ? " Essaie la recherche ✨ IA avec une description plus libre." : ""}
          </Text>
        ) : null}
        {!results && !searching && !aiMode ? (
          <Text style={styles.muted}>Tape pour filtrer instantanément ta bibliothèque.</Text>
        ) : null}
        <View style={styles.grid}>
          {results?.map(({ item, reason }) => (
            <Card key={item.id} item={item} reason={reason} onOpen={openPlayer} />
          ))}
        </View>
      </ScrollView>
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
  },
  heading: { color: colors.text, fontSize: 26, fontWeight: "800", marginBottom: 12 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  aiToggle: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  aiToggleActive: { backgroundColor: colors.emerald },
  aiText: { color: colors.textMuted, fontSize: 13, fontWeight: "700" },
  aiTextActive: { color: "#fff" },
  hint: { color: colors.textFaint, fontSize: 12, marginTop: 8, lineHeight: 17 },
  body: { padding: 16, paddingBottom: 40 },
  center: { alignItems: "center", gap: 8, marginTop: 24 },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  error: { color: "#f87171", fontSize: 13, marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 16, paddingTop: 4 },
});
