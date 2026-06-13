import React from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { Item } from "../types";
import { colors, IDEA_GRADIENTS } from "../theme";
import { hashIndex } from "../util";

/** Bannière héros en haut de l'accueil, façon Netflix / Prime Video. */
export default function HeroBillboard({
  item,
  onPlay,
}: {
  item: Item;
  onPlay: (item: Item) => void;
}) {
  const gradient = IDEA_GRADIENTS[hashIndex(item.id, IDEA_GRADIENTS.length)];

  const overlay = (
    <LinearGradient
      colors={["transparent", "rgba(9,9,11,0.15)", "rgba(9,9,11,0.9)", colors.bg]}
      locations={[0, 0.45, 0.85, 1]}
      style={styles.overlay}
    >
      {item.category ? <Text style={styles.kicker}>{item.category.toUpperCase()}</Text> : null}
      <Text style={styles.title} numberOfLines={3}>
        {item.title}
      </Text>
      {item.author ? <Text style={styles.author}>{item.author}</Text> : null}
      <View style={styles.buttons}>
        <Pressable style={styles.playBtn} onPress={() => onPlay(item)}>
          <Text style={styles.playText}>▶  Lecture</Text>
        </Pressable>
        <Pressable style={styles.infoBtn} onPress={() => onPlay(item)}>
          <Text style={styles.infoText}>ⓘ  Infos</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );

  return (
    <View style={styles.root}>
      {item.thumbnail ? (
        <ImageBackground source={{ uri: item.thumbnail }} style={styles.bg} resizeMode="cover">
          {overlay}
        </ImageBackground>
      ) : (
        <LinearGradient colors={gradient} style={styles.bg}>
          {overlay}
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { height: 440, backgroundColor: colors.surfaceAlt },
  bg: { flex: 1, justifyContent: "flex-end" },
  overlay: { paddingHorizontal: 20, paddingBottom: 18, paddingTop: 120 },
  kicker: {
    color: colors.redLight,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: { color: "#fff", fontSize: 30, fontWeight: "900", lineHeight: 34 },
  author: { color: colors.textMuted, fontSize: 14, marginTop: 8 },
  buttons: { flexDirection: "row", gap: 12, marginTop: 18 },
  playBtn: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 26,
    paddingVertical: 12,
    alignItems: "center",
  },
  playText: { color: "#000", fontWeight: "800", fontSize: 15 },
  infoBtn: {
    flexDirection: "row",
    backgroundColor: "rgba(109,109,110,0.65)",
    borderRadius: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    alignItems: "center",
  },
  infoText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
