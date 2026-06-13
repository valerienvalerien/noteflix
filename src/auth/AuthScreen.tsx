import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../supabase";
import { isSupabaseConfigured } from "../supabase";
import { colors } from "../theme";

export default function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError("Renseigne ton e-mail et ton mot de passe.");
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (!data.session) {
          setInfo("Compte créé ! Vérifie ta boîte mail pour confirmer, puis connecte-toi.");
          setMode("signin");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'authentification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>NOTEFLIX</Text>
        <Text style={styles.tagline}>Ton second cerveau vidéo.</Text>

        {!isSupabaseConfigured ? (
          <Text style={styles.warn}>
            ⚠️ Supabase non configuré. Renseigne EXPO_PUBLIC_SUPABASE_URL et
            EXPO_PUBLIC_SUPABASE_ANON_KEY dans .env (voir SETUP.md).
          </Text>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.heading}>
            {mode === "signin" ? "Connexion" : "Créer un compte"}
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="E-mail"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Mot de passe"
            placeholderTextColor={colors.textFaint}
            secureTextEntry
            style={styles.input}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {info ? <Text style={styles.info}>{info}</Text> : null}

          <Pressable
            style={[styles.submit, loading && styles.disabled]}
            onPress={submit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {mode === "signin" ? "Se connecter" : "Créer mon compte"}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setInfo(null);
            }}
          >
            <Text style={styles.switch}>
              {mode === "signin"
                ? "Pas encore de compte ? Créer un compte"
                : "Déjà un compte ? Se connecter"}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  logo: {
    color: colors.red,
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 28,
  },
  warn: {
    color: "#fbbf24",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 17,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  heading: { color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: 16 },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
    marginBottom: 12,
  },
  error: { color: "#f87171", fontSize: 13, marginBottom: 8 },
  info: { color: colors.emeraldText, fontSize: 13, marginBottom: 8 },
  submit: {
    backgroundColor: colors.red,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  disabled: { opacity: 0.6 },
  switch: { color: colors.textMuted, fontSize: 13, textAlign: "center", marginTop: 16 },
});
