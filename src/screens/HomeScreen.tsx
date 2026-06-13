import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import type { Item } from "../types";
import { parseVideoUrl } from "../video";
import { useLibrary } from "../library/LibraryContext";
import { colors } from "../theme";
import HeroBillboard from "../components/HeroBillboard";
import Row from "../components/Row";
import RecommendModal from "../components/RecommendModal";

export default function HomeScreen() {
  const { items, loaded, openPlayer, openAdd } = useLibrary();
  const insets = useSafeAreaInsets();
  const [showRecommend, setShowRecommend] = useState(false);
  const [clip, setClip] = useState<string | null>(null);

  // Capture ultra-rapide : si le presse-papier contient un lien vidéo, propose-le.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Clipboard.getStringAsync()
        .then((s) => {
          if (!active) return;
          const trimmed = (s ?? "").trim();
          const parsed = trimmed.startsWith("http") ? parseVideoUrl(trimmed) : null;
          const known = parsed && parsed.platform !== "other";
          const already = items.some((i) => i.url === trimmed);
          setClip(known && !already ? trimmed : null);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [items]),
  );

  const hero = items[0];
  const recent = useMemo(() => items.slice(0, 14), [items]);
  const resume = useMemo(
    () => items.filter((i) => i.view_count > 0).sort((a, b) => b.view_count - a.view_count).slice(0, 14),
    [items],
  );
  const byCategory = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const item of items) {
      const key = item.category ?? "Sans catégorie";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [items]);

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {loaded && items.length === 0 ? (
          <View style={[styles.empty, { paddingTop: insets.top + 120 }]}>
            <Text style={styles.emptyEmoji}>🎬</Text>
            <Text style={styles.emptyTitle}>Ta bibliothèque est vide</Text>
            <Text style={styles.emptyText}>
              Colle un lien YouTube, TikTok ou Instagram — ou note une idée. Décris pourquoi tu la
              gardes : c'est ce qui te permettra de la retrouver dans 6 mois en langage naturel.
            </Text>
            <Pressable style={styles.emptyBtn} onPress={() => openAdd()}>
              <Text style={styles.emptyBtnText}>+ Ajouter mon premier item</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {hero ? <HeroBillboard item={hero} onPlay={openPlayer} /> : <View style={{ height: insets.top + 60 }} />}
            <View style={{ marginTop: 8 }}>
              <Row title="Ajouts récents" items={recent} onOpen={openPlayer} />
              {resume.length > 0 ? <Row title="Reprendre" items={resume} onOpen={openPlayer} /> : null}
              {[...byCategory.entries()].map(([name, rowItems]) => (
                <Row key={name} title={name} items={rowItems} onOpen={openPlayer} />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Header flottant façon Netflix */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <Text style={styles.logo}>NOTEFLIX</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.pill} onPress={() => setShowRecommend(true)}>
            <Text style={styles.pillText}>✨ Suggère-moi</Text>
          </Pressable>
          <Pressable style={styles.addBtn} onPress={() => openAdd()}>
            <Text style={styles.addBtnText}>+</Text>
          </Pressable>
        </View>
      </View>

      {/* Bannière « coller » */}
      {clip ? (
        <Pressable
          style={[styles.clipBanner, { top: insets.top + 56 }]}
          onPress={() => {
            openAdd(clip);
            setClip(null);
          }}
        >
          <Text style={styles.clipText} numberOfLines={1}>
            📋 Coller le lien copié
          </Text>
          <Text style={styles.clipUrl} numberOfLines={1}>
            {clip}
          </Text>
        </Pressable>
      ) : null}

      {!loaded ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color={colors.red} />
        </View>
      ) : null}

      {showRecommend ? (
        <RecommendModal
          items={items}
          onClose={() => setShowRecommend(false)}
          onOpenItem={(item) => {
            setShowRecommend(false);
            openPlayer(item);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { color: colors.red, fontSize: 24, fontWeight: "900", letterSpacing: 0.5 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  pill: {
    backgroundColor: "rgba(39,39,42,0.85)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  addBtn: {
    backgroundColor: colors.red,
    borderRadius: 999,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontSize: 22, fontWeight: "700", marginTop: -2 },
  clipBanner: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.redLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  clipText: { color: colors.text, fontSize: 13, fontWeight: "700" },
  clipUrl: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  empty: { alignItems: "center", paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: "700", marginTop: 16 },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 },
  emptyBtn: {
    marginTop: 24,
    backgroundColor: colors.red,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 11,
  },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
