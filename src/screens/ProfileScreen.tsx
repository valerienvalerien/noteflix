import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../supabase";
import { useAuth } from "../auth/AuthProvider";
import { useLibrary } from "../library/LibraryContext";
import { colors } from "../theme";

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { items, categories } = useLibrary();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const videos = items.filter((i) => i.type === "video").length;
  const ideas = items.filter((i) => i.type === "idea").length;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.heading}>Profil</Text>
        <Text style={styles.email}>{email ?? "…"}</Text>
      </View>

      <View style={styles.statsRow}>
        <Stat value={videos} label="Vidéos" />
        <Stat value={ideas} label="Idées" />
        <Stat value={categories.length} label="Catégories" />
      </View>

      <View style={styles.section}>
        <Text style={styles.note}>
          Tes données sont synchronisées dans le cloud (Supabase) et accessibles depuis tous tes
          appareils avec ce compte.
        </Text>
      </View>

      <Pressable style={styles.signOut} onPress={signOut}>
        <Text style={styles.signOutText}>Se déconnecter</Text>
      </Pressable>
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
  section: { paddingHorizontal: 16 },
  note: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  signOut: {
    marginTop: 28,
    marginHorizontal: 16,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutText: { color: colors.redLight, fontWeight: "700", fontSize: 15 },
});
