import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Category } from "../types";
import { deleteCategory, renameCategory } from "../data";
import { colors } from "../theme";

export default function CategoriesModal({
  categories,
  onClose,
  onChanged,
}: {
  categories: Category[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(categories.map((c) => [c.id, c.name])),
  );
  const [error, setError] = useState<string | null>(null);

  const rename = async (cat: Category) => {
    const next = (drafts[cat.id] ?? "").trim();
    if (!next || next === cat.name) return;
    setError(null);
    try {
      await renameCategory(cat.id, next);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec du renommage");
      setDrafts((d) => ({ ...d, [cat.id]: cat.name }));
    }
  };

  const confirmDelete = (cat: Category) => {
    Alert.alert(
      "Supprimer la catégorie",
      `« ${cat.name} » sera supprimée. Les vidéos rattachées passeront en « Sans catégorie ».`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await deleteCategory(cat.id).catch(() => {});
            onChanged();
          },
        },
      ],
    );
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} transparent={false}>
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.heading}>Mes catégories</Text>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {categories.length === 0 ? (
            <Text style={styles.muted}>Aucune catégorie pour l'instant.</Text>
          ) : null}
          {categories.map((cat) => (
            <View key={cat.id} style={styles.row}>
              <TextInput
                value={drafts[cat.id] ?? ""}
                onChangeText={(v) => setDrafts((d) => ({ ...d, [cat.id]: v }))}
                onEndEditing={() => rename(cat)}
                style={styles.input}
                returnKeyType="done"
              />
              <Pressable style={styles.delBtn} onPress={() => confirmDelete(cat)} hitSlop={6}>
                <Text style={styles.delText}>🗑</Text>
              </Pressable>
            </View>
          ))}
          <Text style={styles.hint}>
            Renomme une catégorie en éditant son nom (validé en quittant le champ). Crée de nouvelles
            catégories directement à l'ajout d'un item.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  heading: { color: colors.text, fontSize: 20, fontWeight: "700" },
  closeBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: colors.text, fontSize: 14 },
  body: { padding: 16, paddingBottom: 60 },
  error: { color: "#f87171", fontSize: 13, marginBottom: 12 },
  muted: { color: colors.textMuted, fontSize: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: colors.text,
    fontSize: 15,
  },
  delBtn: { padding: 8 },
  delText: { fontSize: 18 },
  hint: { color: colors.textFaint, fontSize: 12, marginTop: 12, lineHeight: 18 },
});
