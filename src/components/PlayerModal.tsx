import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import type { Item } from "../types";
import { buildEmbedUrl } from "../video";
import { markViewed, summarizeItem } from "../data";
import { colors } from "../theme";

function formatDate(raw: string): string {
  const iso = raw.includes("T") ? raw : raw.replace(" ", "T") + "Z";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR");
}

export default function PlayerModal({
  item,
  onClose,
  onDelete,
  onToggleFavorite,
  onEdit,
}: {
  item: Item;
  onClose: () => void;
  onDelete: (item: Item) => void;
  onToggleFavorite: (item: Item) => void;
  onEdit: (item: Item) => void;
}) {
  const embedUrl =
    item.type === "video" && item.platform ? buildEmbedUrl(item.platform, item.video_id, true) : null;
  const isVertical = item.platform === "tiktok" || item.platform === "instagram";

  const [summary, setSummary] = useState<string | null>(item.summary);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    markViewed(item.id).catch(() => {});
  }, [item.id]);

  const generateSummary = async () => {
    setSummarizing(true);
    setSummaryError(null);
    try {
      setSummary(await summarizeItem(item.id));
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : "Erreur de génération");
    } finally {
      setSummarizing(false);
    }
  };

  const openOriginal = () => {
    if (!item.url) return;
    WebBrowser.openBrowserAsync(item.url).catch(() => Linking.openURL(item.url!).catch(() => {}));
  };

  const confirmDelete = () => {
    Alert.alert("Supprimer", "Supprimer cet item de ta bibliothèque ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => onDelete(item) },
    ]);
  };

  const meta = [item.author, item.category, formatDate(item.created_at)].filter(Boolean).join(" · ");

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} transparent={false}>
      <View style={styles.root}>
        {/* Player area */}
        {embedUrl ? (
          <View style={[styles.playerBox, isVertical && styles.playerVertical]}>
            <WebView
              source={{ uri: embedUrl }}
              style={styles.web}
              allowsInlineMediaPlayback
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              domStorageEnabled
            />
          </View>
        ) : item.type === "idea" ? (
          <LinearGradient colors={["#92400e", "#881337"]} style={styles.ideaBanner}>
            <Text style={styles.ideaText}>💡 {item.title}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.fallback}>
            <Text style={styles.fallbackText}>Lecture intégrée indisponible pour ce lien.</Text>
            {item.url ? (
              <Pressable style={styles.primaryBtn} onPress={openOriginal}>
                <Text style={styles.primaryBtnText}>Ouvrir l'original ↗</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        {/* Details */}
        <ScrollView style={styles.details} contentContainerStyle={{ paddingBottom: 32 }}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.title}>{item.title}</Text>
              {meta ? <Text style={styles.metaLine}>{meta}</Text> : null}
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {item.description ? <Text style={styles.description}>{item.description}</Text> : null}

          {summary ? (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>✨ Résumé IA</Text>
              <Text style={styles.summaryText}>{summary}</Text>
            </View>
          ) : (
            <Pressable
              style={styles.summaryBtn}
              onPress={generateSummary}
              disabled={summarizing}
            >
              {summarizing ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.summaryBtnText}>✨ Générer un résumé IA</Text>
              )}
            </Pressable>
          )}
          {summaryError ? <Text style={styles.summaryErrorText}>{summaryError}</Text> : null}

          {item.tags.length > 0 && (
            <View style={styles.tagRow}>
              {item.tags.map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>#{t}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <Pressable
              style={[styles.secondaryBtn, item.is_favorite && styles.favActive]}
              onPress={() => onToggleFavorite(item)}
            >
              <Text style={[styles.secondaryBtnText, item.is_favorite && styles.favActiveText]}>
                {item.is_favorite ? "✓ Ma Liste" : "+ Ma Liste"}
              </Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => onEdit(item)}>
              <Text style={styles.secondaryBtnText}>Modifier</Text>
            </Pressable>
            {item.url ? (
              <Pressable style={styles.secondaryBtn} onPress={openOriginal}>
                <Text style={styles.secondaryBtnText}>Ouvrir ↗</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.deleteBtn} onPress={confirmDelete}>
              <Text style={styles.deleteText}>Supprimer</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  playerBox: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000" },
  playerVertical: { aspectRatio: 9 / 16, maxHeight: "60%", alignSelf: "center" },
  web: { flex: 1, backgroundColor: "#000" },
  ideaBanner: { padding: 28, minHeight: 140, justifyContent: "center" },
  ideaText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  fallback: { padding: 28, minHeight: 140, alignItems: "center", justifyContent: "center", gap: 12 },
  fallbackText: { color: colors.textMuted, textAlign: "center" },
  details: { flex: 1, paddingHorizontal: 20, paddingTop: 18 },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  title: { color: colors.text, fontSize: 19, fontWeight: "700" },
  metaLine: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  closeBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: colors.text, fontSize: 14 },
  description: { color: "#d4d4d8", fontSize: 14, marginTop: 14, lineHeight: 20 },
  summaryBox: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
  },
  summaryLabel: { color: colors.emeraldText, fontSize: 12, fontWeight: "800", marginBottom: 6 },
  summaryText: { color: "#d4d4d8", fontSize: 14, lineHeight: 21 },
  summaryBtn: {
    marginTop: 16,
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  summaryBtnText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  summaryErrorText: { color: "#f87171", fontSize: 12, marginTop: 8 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 14 },
  tag: { backgroundColor: colors.surfaceAlt, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { color: "#d4d4d8", fontSize: 12 },
  actions: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginTop: 22, gap: 10 },
  primaryBtn: { backgroundColor: colors.red, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  secondaryBtn: { backgroundColor: colors.surfaceAlt, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  secondaryBtnText: { color: colors.text, fontSize: 13 },
  favActive: { backgroundColor: colors.red },
  favActiveText: { color: "#fff", fontWeight: "700" },
  deleteBtn: { paddingHorizontal: 12, paddingVertical: 10 },
  deleteText: { color: "#f87171", fontSize: 13 },
});
