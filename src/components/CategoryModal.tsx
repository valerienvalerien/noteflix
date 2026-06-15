import React, { useMemo } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Item } from "../types";
import { colors } from "../theme";
import Card from "./Card";

export default function CategoryModal({
  name,
  items,
  onOpen,
  onClose,
}: {
  name: string;
  items: Item[];
  onOpen: (item: Item) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const list = useMemo(
    () => items.filter((i) => (i.category ?? "Sans catégorie") === name),
    [items, name],
  );

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} transparent={false}>
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>CATÉGORIE</Text>
            <Text style={styles.title}>{name}</Text>
            <Text style={styles.count}>
              {list.length} élément{list.length > 1 ? "s" : ""}
            </Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.grid}>
            {list.map((item) => (
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
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
  body: { padding: 16, paddingBottom: 40 },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 16, paddingTop: 4 },
});
