import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { Item } from "../types";
import { colors } from "../theme";
import Card from "./Card";

export default function Row({
  title,
  items,
  onOpen,
}: {
  title: string;
  items: Item[];
  onOpen: (item: Item) => void;
}) {
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
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
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  scroll: { paddingHorizontal: 16, paddingRight: 4 },
});
