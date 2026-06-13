import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getApiKey, setApiKey } from "../apiKey";
import { colors } from "../theme";

export default function SettingsModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [key, setKey] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getApiKey().then((k) => {
      if (k) setKey(k);
      setLoaded(true);
    });
  }, []);

  const save = async () => {
    await setApiKey(key);
    setSaved(true);
    onSaved();
    setTimeout(onClose, 400);
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} transparent={false}>
      <View style={styles.root}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>⚙ Réglages</Text>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Clé API Anthropic</Text>
          <Text style={styles.help}>
            Nécessaire pour la recherche ✨ IA et les recommandations. Ta clé est stockée de façon
            sécurisée sur cet appareil uniquement (jamais envoyée ailleurs qu'à l'API Claude).
          </Text>
          <TextInput
            value={key}
            onChangeText={(v) => {
              setKey(v);
              setSaved(false);
            }}
            placeholder="sk-ant-…"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            editable={loaded}
            style={styles.input}
          />

          <Pressable style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveBtnText}>{saved ? "Enregistré ✓" : "Enregistrer"}</Text>
          </Pressable>

          <Text style={styles.footnote}>
            Obtiens une clé sur console.anthropic.com → API Keys. Sans clé, la bibliothèque et la
            recherche instantanée fonctionnent ; seules les fonctions IA sont désactivées.
          </Text>
        </ScrollView>
      </View>
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
  body: { padding: 20 },
  label: { color: colors.text, fontSize: 15, fontWeight: "600", marginBottom: 6 },
  help: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginBottom: 14 },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: colors.text,
    fontSize: 14,
  },
  saveBtn: {
    marginTop: 18,
    backgroundColor: colors.red,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  footnote: { color: colors.textFaint, fontSize: 12, lineHeight: 17, marginTop: 20 },
});
