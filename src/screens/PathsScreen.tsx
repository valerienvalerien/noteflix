import React, { useEffect, useMemo, useState } from "react";
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
import type { LearningPath } from "../types";
import { deletePath, generatePath, listPaths } from "../data";
import { useLibrary } from "../library/LibraryContext";
import { colors } from "../theme";

const EXAMPLES = [
  "Apprendre le closing en 30 jours",
  "Maîtriser les nœuds essentiels",
  "Bases du mandarin en 2 semaines",
];

export default function PathsScreen() {
  const { items, openPlayer } = useLibrary();
  const insets = useSafeAreaInsets();
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [error, setError] = useState<string | null>(null);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  useEffect(() => {
    listPaths().then(setPaths).catch(() => {});
  }, []);

  const generate = async () => {
    if (!goal.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const path = await generatePath(goal.trim());
      setPaths((p) => [path, ...p]);
      setGoal("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de générer le parcours");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    await deletePath(id).catch(() => {});
    setPaths((p) => p.filter((x) => x.id !== id));
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.heading}>Parcours</Text>
        <Text style={styles.sub}>
          Donne un objectif : l'IA bâtit un parcours d'apprentissage à partir de TA bibliothèque.
        </Text>
        <View style={styles.askRow}>
          <TextInput
            value={goal}
            onChangeText={setGoal}
            onSubmitEditing={() => !loading && generate()}
            placeholder="Ex : apprendre le closing en 30 jours"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
          />
          <Pressable
            style={[styles.goBtn, loading && styles.disabled]}
            onPress={generate}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.goText}>Créer</Text>}
          </Pressable>
        </View>
        <View style={styles.chips}>
          {EXAMPLES.map((ex) => (
            <Pressable key={ex} style={styles.chip} onPress={() => setGoal(ex)}>
              <Text style={styles.chipText}>{ex}</Text>
            </Pressable>
          ))}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.textMuted} />
          <Text style={styles.muted}>Claude construit ton parcours…</Text>
        </View>
      ) : null}

      {paths.length === 0 && !loading ? (
        <Text style={[styles.muted, { paddingHorizontal: 16, marginTop: 24 }]}>
          Aucun parcours pour l'instant. Lance-toi avec un objectif ci-dessus.
        </Text>
      ) : null}

      {paths.map((path) => (
        <View key={path.id} style={styles.pathCard}>
          <View style={styles.pathHead}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.pathTitle}>{path.title}</Text>
              <Text style={styles.pathGoal}>🎯 {path.goal}</Text>
            </View>
            <Pressable onPress={() => remove(path.id)} hitSlop={8}>
              <Text style={styles.remove}>✕</Text>
            </Pressable>
          </View>

          {path.steps.map((step, idx) => {
            const item = byId.get(step.item_id);
            return (
              <Pressable
                key={`${path.id}-${idx}`}
                style={styles.step}
                onPress={() => item && openPlayer(item)}
              >
                <View style={styles.dayBadge}>
                  <Text style={styles.dayText}>{step.day}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepWhy}>{step.why}</Text>
                  {item ? (
                    <Text style={styles.stepLink} numberOfLines={1}>
                      ▶ {item.title}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  heading: { color: colors.text, fontSize: 26, fontWeight: "800" },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 6, lineHeight: 18 },
  askRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: colors.text,
    fontSize: 14,
  },
  goBtn: {
    backgroundColor: colors.red,
    borderRadius: 10,
    paddingHorizontal: 18,
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  goText: { color: "#fff", fontWeight: "700" },
  disabled: { opacity: 0.6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { color: colors.textMuted, fontSize: 12 },
  error: { color: "#f87171", fontSize: 13, marginTop: 12 },
  loading: { alignItems: "center", gap: 8, marginTop: 24 },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  pathCard: {
    marginTop: 18,
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
  },
  pathHead: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  pathTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
  pathGoal: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  remove: { color: colors.textFaint, fontSize: 16 },
  step: { flexDirection: "row", gap: 12, marginTop: 14, alignItems: "flex-start" },
  dayBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  stepTitle: { color: colors.text, fontSize: 14, fontWeight: "600" },
  stepWhy: { color: colors.textMuted, fontSize: 12, marginTop: 2, lineHeight: 17 },
  stepLink: { color: colors.emeraldText, fontSize: 12, marginTop: 4 },
});
