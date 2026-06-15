import React, { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform as RNPlatform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Category, Item } from "../types";
import { resolveMetadata, ResolvedMeta } from "../metadata";
import { createItem, updateItem } from "../data";
import { colors } from "../theme";

export default function AddModal({
  categories,
  initialUrl,
  item,
  onClose,
  onCreated,
}: {
  categories: Category[];
  initialUrl?: string | null;
  item?: Item | null;
  onClose: () => void;
  onCreated: (item: Item) => void;
}) {
  const editing = !!item;
  const [mode, setMode] = useState<"video" | "idea">(item?.type ?? "video");
  const [url, setUrl] = useState(item?.url ?? initialUrl ?? "");
  const [meta, setMeta] = useState<ResolvedMeta | null>(
    item && item.type === "video"
      ? {
          platform: item.platform ?? "other",
          video_id: item.video_id,
          url: item.url ?? "",
          title: item.title,
          author: item.author,
          thumbnail: item.thumbnail,
        }
      : null,
  );
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [category, setCategory] = useState(item?.category ?? "");
  const [newCategory, setNewCategory] = useState("");
  const [tags, setTags] = useState(item ? item.tags.join(", ") : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fetch metadata after the user pastes/edits a URL
  useEffect(() => {
    if (mode !== "video" || !url.trim().startsWith("http")) return;
    const t = setTimeout(async () => {
      setFetchingMeta(true);
      setError(null);
      try {
        const data = await resolveMetadata(url.trim());
        if (data) {
          setMeta(data);
          if (data.title && !title) setTitle(data.title);
        }
      } catch {
        // best-effort
      } finally {
        setFetchingMeta(false);
      }
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, mode]);

  const submit = async () => {
    if (!title.trim()) {
      setError("Donne un titre.");
      return;
    }
    setSaving(true);
    setError(null);
    const chosenCategory = newCategory.trim() || category || null;
    const payload = {
      type: mode,
      url: mode === "video" ? meta?.url ?? url.trim() ?? null : null,
      platform: mode === "video" ? meta?.platform ?? null : null,
      video_id: mode === "video" ? meta?.video_id ?? null : null,
      title: title.trim(),
      description: description.trim(),
      author: mode === "video" ? meta?.author ?? item?.author ?? null : null,
      thumbnail: mode === "video" ? meta?.thumbnail ?? null : null,
      category: chosenCategory,
      tags: tags
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean),
    };
    try {
      const saved = editing ? await updateItem(item!.id, payload) : await createItem(payload);
      onCreated(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur à l'enregistrement");
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} transparent={false}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={RNPlatform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.headerRow}>
          <Text style={styles.heading}>
            {editing ? "Modifier l'item" : "Ajouter à ma bibliothèque"}
          </Text>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.modeRow}>
            {(["video", "idea"] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={[styles.modePill, mode === m && styles.modePillActive]}
              >
                <Text style={[styles.modePillText, mode === m && styles.modePillTextActive]}>
                  {m === "video" ? "🎬 Vidéo" : "💡 Idée"}
                </Text>
              </Pressable>
            ))}
          </View>

          {mode === "video" && (
            <View style={styles.field}>
              <Text style={styles.label}>Lien YouTube / Shorts / TikTok / Instagram</Text>
              <TextInput
                value={url}
                onChangeText={setUrl}
                placeholder="Colle l'URL ici…"
                placeholderTextColor={colors.textFaint}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={styles.input}
              />
              {fetchingMeta ? <Text style={styles.hint}>Récupération des infos…</Text> : null}
              {meta?.thumbnail ? (
                <Image source={{ uri: meta.thumbnail }} style={styles.preview} resizeMode="cover" />
              ) : null}
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Titre</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={mode === "idea" ? "Mon idée en une phrase" : "Titre de la vidéo"}
              placeholderTextColor={colors.textFaint}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Pourquoi tu la gardes ?{" "}
              <Text style={styles.labelFaint}>(c'est ce qui te permettra de la retrouver)</Text>
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              placeholder="Ex : le youtubeur qui explique le nœud de chaise avec l'astuce du serpent…"
              placeholderTextColor={colors.textFaint}
              style={[styles.input, styles.textarea]}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Catégorie</Text>
            <View style={styles.chipRow}>
              <Pressable
                onPress={() => setCategory("")}
                style={[styles.chip, category === "" && styles.chipActive]}
              >
                <Text style={[styles.chipText, category === "" && styles.chipTextActive]}>
                  Aucune
                </Text>
              </Pressable>
              {categories.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    setCategory(c.name);
                    setNewCategory("");
                  }}
                  style={[styles.chip, category === c.name && styles.chipActive]}
                >
                  <Text style={[styles.chipText, category === c.name && styles.chipTextActive]}>
                    {c.name}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={newCategory}
              onChangeText={(v) => {
                setNewCategory(v);
                if (v.trim()) setCategory("");
              }}
              placeholder="…ou nouvelle catégorie"
              placeholderTextColor={colors.textFaint}
              style={[styles.input, { marginTop: 8 }]}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tags (séparés par des virgules)</Text>
            <TextInput
              value={tags}
              onChangeText={setTags}
              placeholder="closing, objection, script"
              placeholderTextColor={colors.textFaint}
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.saveBtn, saving && styles.disabled]}
            onPress={submit}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? "Enregistrement…" : "Enregistrer"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  heading: { color: colors.text, fontSize: 18, fontWeight: "700" },
  closeBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: colors.text, fontSize: 14 },
  body: { padding: 20, paddingBottom: 60 },
  modeRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  modePill: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surfaceAlt,
  },
  modePillActive: { backgroundColor: colors.red },
  modePillText: { color: colors.textMuted, fontWeight: "600", fontSize: 13 },
  modePillTextActive: { color: "#fff" },
  field: { marginTop: 18 },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: "500", marginBottom: 6 },
  labelFaint: { color: colors.textFaint, fontWeight: "400" },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  hint: { color: colors.textFaint, fontSize: 12, marginTop: 6 },
  preview: { marginTop: 10, height: 120, borderRadius: 10, width: "100%" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderInput,
  },
  chipActive: { backgroundColor: colors.red, borderColor: colors.red },
  chipText: { color: colors.textMuted, fontSize: 13 },
  chipTextActive: { color: "#fff" },
  error: { color: "#f87171", fontSize: 13, marginTop: 14 },
  saveBtn: {
    marginTop: 22,
    backgroundColor: colors.red,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  disabled: { opacity: 0.5 },
});
