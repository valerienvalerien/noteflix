import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../supabase";
import { exportData, reindexEmbeddings, updatePassword } from "../data";
import { useAuth } from "../auth/AuthProvider";
import { useLibrary } from "../library/LibraryContext";
import CategoriesModal from "../components/CategoriesModal";
import { colors } from "../theme";

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { items, categories, refresh } = useLibrary();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const reindex = async () => {
    setBusy("reindex");
    setMsg(null);
    try {
      const n = await reindexEmbeddings(false);
      setMsg(n > 0 ? `${n} item(s) réindexé(s).` : "Tout est déjà indexé.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Échec de la réindexation.");
    } finally {
      setBusy(null);
    }
  };

  const doExport = async () => {
    setBusy("export");
    setMsg(null);
    try {
      const json = await exportData();
      await Share.share({ message: json });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Échec de l'export.");
    } finally {
      setBusy(null);
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) {
      setMsg("Mot de passe : 6 caractères minimum.");
      return;
    }
    setBusy("pw");
    setMsg(null);
    try {
      await updatePassword(newPassword);
      setNewPassword("");
      setShowPwForm(false);
      setMsg("Mot de passe mis à jour.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Échec de la mise à jour.");
    } finally {
      setBusy(null);
    }
  };

  const videos = items.filter((i) => i.type === "video").length;
  const ideas = items.filter((i) => i.type === "idea").length;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.heading}>Profil</Text>
        <Text style={styles.email}>{email ?? "…"}</Text>
      </View>

      <View style={styles.statsRow}>
        <Stat value={videos} label="Vidéos" />
        <Stat value={ideas} label="Idées" />
        <Stat value={categories.length} label="Catégories" />
      </View>

      <View style={styles.group}>
        <Action label="🗂  Gérer mes catégories" onPress={() => setShowCategories(true)} chevron />
        <Action
          label="↻  Réindexer la recherche"
          onPress={reindex}
          loading={busy === "reindex"}
        />
        <Action label="⤓  Exporter mes données (JSON)" onPress={doExport} loading={busy === "export"} />
        <Action
          label="🔑  Changer le mot de passe"
          onPress={() => setShowPwForm((v) => !v)}
          chevron
        />
      </View>

      {showPwForm ? (
        <View style={styles.pwForm}>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Nouveau mot de passe"
            placeholderTextColor={colors.textFaint}
            secureTextEntry
            style={styles.input}
          />
          <Pressable
            style={[styles.pwBtn, busy === "pw" && styles.disabled]}
            onPress={changePassword}
            disabled={busy === "pw"}
          >
            {busy === "pw" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.pwBtnText}>Mettre à jour</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      {msg ? <Text style={styles.msg}>{msg}</Text> : null}

      <Pressable style={styles.signOut} onPress={signOut}>
        <Text style={styles.signOutText}>Se déconnecter</Text>
      </Pressable>

      {showCategories ? (
        <CategoriesModal
          categories={categories}
          onClose={() => setShowCategories(false)}
          onChanged={refresh}
        />
      ) : null}
    </ScrollView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Action({
  label,
  onPress,
  loading,
  chevron,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  chevron?: boolean;
}) {
  return (
    <Pressable style={styles.action} onPress={onPress} disabled={loading}>
      <Text style={styles.actionText}>{label}</Text>
      {loading ? (
        <ActivityIndicator color={colors.textMuted} />
      ) : chevron ? (
        <Text style={styles.actionChevron}>›</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  heading: { color: colors.text, fontSize: 26, fontWeight: "800" },
  email: { color: colors.textMuted, fontSize: 14, marginTop: 6 },
  statsRow: { flexDirection: "row", gap: 12, padding: 16 },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
  },
  statValue: { color: colors.text, fontSize: 24, fontWeight: "900" },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  group: {
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: "hidden",
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  actionText: { color: colors.text, fontSize: 14, fontWeight: "500" },
  actionChevron: { color: colors.textMuted, fontSize: 20 },
  pwForm: { marginHorizontal: 16, marginTop: 12, flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: colors.text,
    fontSize: 14,
  },
  pwBtn: {
    backgroundColor: colors.red,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  pwBtnText: { color: "#fff", fontWeight: "700" },
  disabled: { opacity: 0.6 },
  msg: { color: colors.textMuted, fontSize: 12, textAlign: "center", marginTop: 12 },
  signOut: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutText: { color: colors.redLight, fontWeight: "700", fontSize: 15 },
});
