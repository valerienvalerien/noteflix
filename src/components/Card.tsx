import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { Item } from "../types";
import { colors, IDEA_GRADIENTS, PLATFORM_BADGE } from "../theme";

export default function Card({
  item,
  reason,
  onOpen,
}: {
  item: Item;
  reason?: string | null;
  onOpen: (item: Item) => void;
}) {
  const badge = item.type === "idea" ? null : PLATFORM_BADGE[item.platform ?? "other"];
  const gradient = IDEA_GRADIENTS[item.id % IDEA_GRADIENTS.length];

  return (
    <Pressable
      onPress={() => onOpen(item)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.thumb}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.image} resizeMode="cover" />
        ) : (
          <LinearGradient colors={gradient} style={styles.placeholder}>
            <Text style={styles.placeholderText} numberOfLines={3}>
              {item.type === "idea" ? "💡 " : "▶ "}
              {item.title}
            </Text>
          </LinearGradient>
        )}
        {badge && (
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.fg }]}>{badge.label}</Text>
          </View>
        )}
        <View style={styles.playOverlay} pointerEvents="none">
          <View style={styles.playDot}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        </View>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      {reason ? (
        <Text style={styles.reason} numberOfLines={2}>
          ✨ {reason}
        </Text>
      ) : null}
    </Pressable>
  );
}

const CARD_WIDTH = 168;

const styles = StyleSheet.create({
  card: { width: CARD_WIDTH, marginRight: 12 },
  pressed: { opacity: 0.8 },
  thumb: {
    width: CARD_WIDTH,
    aspectRatio: 16 / 9,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: colors.surfaceAlt,
  },
  image: { width: "100%", height: "100%" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", padding: 10 },
  placeholderText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  badge: {
    position: "absolute",
    left: 6,
    top: 6,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: "700" },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  playDot: {
    height: 38,
    width: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: { color: colors.bg, fontSize: 15, marginLeft: 2 },
  title: { marginTop: 6, color: colors.text, fontSize: 12, fontWeight: "500" },
  reason: { marginTop: 2, color: colors.emeraldText, fontSize: 11, fontStyle: "italic" },
});
