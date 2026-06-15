import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import type { Item } from "../types";
import { AiDisabledError, recommend, Recommendation } from "../data";
import { colors } from "../theme";

const AI_OFF =
  "✨ Suggestions IA non activées. Ajoute une clé Anthropic (secret Supabase) pour les activer — la recherche, elle, fonctionne déjà.";

export default function RecommendModal({
  items,
  onClose,
  onOpenItem,
}: {
  items: Item[];
  onClose: () => void;
  onOpenItem: (item: Item) => void;
}) {
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Recommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const ask = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    setSuggestions(null);
    try {
      const result = await recommend(theme.trim() || null);
      setSuggestions(result);
    } catch (e) {
      if (e instanceof AiDisabledError) setInfo(AI_OFF);
      else setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} transparent={false}>
      <View style={styles.root}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>✨ Recommandations</Text>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.askRow}>
            <TextInput
              value={theme}
              onChangeText={setTheme}
              onSubmitEditing={() => !loading && ask()}
              placeholder="Un thème ? (optionnel : « nœuds marins »…)"
              placeholderTextColor={colors.textFaint}
              style={styles.input}
            />
            <Pressable style={[styles.askBtn, loading && styles.disabled]} onPress={ask} disabled={loading}>
              <Text style={styles.askBtnText}>{loading ? "…" : "Go"}</Text>
            </Pressable>
          </View>

          {loading && (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.textMuted} />
              <Text style={styles.loadingText}>Claude analyse ta bibliothèque…</Text>
            </View>
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {info ? <Text style={styles.info}>{info}</Text> : null}

          {suggestions &&
            (suggestions.length === 0 ? (
              <Text style={styles.empty}>
                Rien à suggérer pour l'instant — ajoute quelques items !
              </Text>
            ) : (
              suggestions.map((s, i) => {
                const item = s.item_id != null ? byId.get(s.item_id) ?? null : null;
                return (
                  <View key={i} style={styles.suggestion}>
                    <View style={styles.suggestionHead}>
                      <View
                        style={[
                          styles.kindBadge,
                          { backgroundColor: s.kind === "revoir" ? colors.sky : colors.greenBadge },
                        ]}
                      >
                        <Text
                          style={[
                            styles.kindText,
                            { color: s.kind === "revoir" ? colors.skyText : colors.greenBadgeText },
                          ]}
                        >
                          {s.kind === "revoir" ? "À REVOIR" : "À EXPLORER"}
                        </Text>
                      </View>
                      <Text style={styles.suggestionTitle}>{s.title}</Text>
                    </View>
                    <Text style={styles.suggestionReason}>{s.reason}</Text>
                    {s.kind === "revoir" && item ? (
                      <Pressable style={styles.smallBtn} onPress={() => onOpenItem(item)}>
                        <Text style={styles.smallBtnText}>▶ Regarder</Text>
                      </Pressable>
                    ) : null}
                    {s.kind === "explorer" && s.search_url ? (
                      <Pressable
                        style={styles.smallBtn}
                        onPress={() => WebBrowser.openBrowserAsync(s.search_url!).catch(() => {})}
                      >
                        <Text style={styles.smallBtnText}>Chercher sur YouTube ↗</Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })
            ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  heading: { color: colors.text, fontSize: 18, fontWeight: "700" },
  closeBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: colors.text, fontSize: 14 },
  body: { padding: 20, paddingBottom: 60 },
  askRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  askBtn: {
    backgroundColor: colors.red,
    borderRadius: 10,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  askBtnText: { color: "#fff", fontWeight: "700" },
  disabled: { opacity: 0.5 },
  loading: { alignItems: "center", marginTop: 26, gap: 10 },
  loadingText: { color: colors.textMuted, fontSize: 13 },
  error: { color: "#f87171", fontSize: 13, marginTop: 16 },
  info: { color: colors.textMuted, fontSize: 13, marginTop: 16, lineHeight: 19 },
  empty: { color: colors.textMuted, fontSize: 14, marginTop: 20 },
  suggestion: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(9,9,11,0.6)",
    borderRadius: 10,
    padding: 14,
    marginTop: 14,
  },
  suggestionHead: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  kindBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  kindText: { fontSize: 10, fontWeight: "800" },
  suggestionTitle: { color: colors.text, fontSize: 14, fontWeight: "600", flexShrink: 1 },
  suggestionReason: { color: colors.textMuted, fontSize: 12, marginTop: 6, lineHeight: 17 },
  smallBtn: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  smallBtnText: { color: colors.text, fontSize: 12, fontWeight: "500" },
});
