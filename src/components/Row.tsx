import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Item } from "../types";
import { colors } from "../theme";
import Card from "./Card";

export default function Row({
  title,
  items,
  onOpen,
  onTitlePress,
}: {
  title: string;
  items: Item[];
  onOpen: (item: Item) => void;
  onTitlePress?: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      {onTitlePress ? (
        <Pressable style={styles.titleRow} onPress={onTitlePress}>
          <Text style={styles.titleInline}>{title}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ) : (
        <Text style={styles.title}>{title}</Text>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {items.map((item) => (
          <Card key={item.id} item={item} onOpen={onOpen} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  titleInline: { color: colors.text, fontSize: 17, fontWeight: "700" },
  chevron: { color: colors.textMuted, fontSize: 22, marginLeft: 4, marginTop: -2 },
  scroll: { paddingHorizontal: 16, paddingRight: 4 },
});
