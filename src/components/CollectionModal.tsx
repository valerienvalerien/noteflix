import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Item } from "../types";
import { colors } from "../theme";
import Card from "./Card";

type Sort = "recent" | "az" | "views";

const SORTS: { key: Sort; label: string }[] = [
  { key: "recent", label: "Récents" },
  { key: "az", label: "A → Z" },
  { key: "views", label: "Plus vus" },
];

/** Écran générique d'une collection d'items (catégorie, tag…) avec tri. */
export default function CollectionModal({
  title,
  items,
  onOpen,
  onClose,
}: {
  title: string;
  items: Item[];
  onOpen: (item: Item) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [sort, setSort] = useState<Sort>("recent");

  const sorted = useMemo(() => {
    const copy = [...items];
    if (sort === "az") copy.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "views") copy.sort((a, b) => b.view_count - a.view_count);
    else copy.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
    return copy;
  }, [items, sort]);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} transparent={false}>
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>COLLECTION</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.count}>
              {items.length} élément{items.length > 1 ? "s" : ""}
            </Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.sorts}>
          {SORTS.map((s) => (
            <Pressable
              key={s.key}
              onPress={() => setSort(s.key)}
              style={[styles.sortChip, sort === s.key && styles.sortChipActive]}
            >
              <Text style={[styles.sortText, sort === s.key && styles.sortTextActive]}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.grid}>
            {sorted.map((item) => (
              <Card key={item.id} item={item} onOpen={onOpen} />
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  kicker: { color: colors.redLight, fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 26, fontWeight: "800", marginTop: 4 },
  count: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  closeBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: colors.text, fontSize: 14 },
  sorts: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sortChip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sortChipActive: { backgroundColor: colors.red },
  sortText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  sortTextActive: { color: "#fff" },
  body: { padding: 16, paddingBottom: 40 },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 16, paddingTop: 4 },
});
