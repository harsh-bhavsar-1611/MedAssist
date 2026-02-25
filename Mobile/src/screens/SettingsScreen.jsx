import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { GradientBackground } from "../components/GradientBackground";
import { ApiError, apiFetch } from "../api/client";
import { palette } from "../theme/palette";
import { useAuth } from "../context/AuthContext";

const THEME_OPTIONS = ["light", "dark"];

export function SettingsScreen({ navigation }) {
  const { token } = useAuth();
  const [theme, setTheme] = useState("light");
  const [themeSaving, setThemeSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [isPasswordRequired, setIsPasswordRequired] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiFetch("/api/auth/settings/", {}, token);
        const settings = response?.data?.settings;
        if (settings?.preferred_theme) setTheme(settings.preferred_theme);
        setIsPasswordRequired(settings?.password_required ?? true);
      } catch {
        // keep defaults
      }
    };
    load();
  }, [token]);

  const saveTheme = async () => {
    setThemeSaving(true);
    setError("");
    setInfo("");
    try {
      const response = await apiFetch(
        "/api/auth/settings/",
        { method: "PATCH", body: { preferred_theme: theme } },
        token
      );
      setInfo(response?.message || "Theme updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save theme.");
    } finally {
      setThemeSaving(false);
    }
  };

  const changePassword = async () => {
    setPasswordSaving(true);
    setError("");
    setInfo("");
    try {
      const response = await apiFetch(
        "/api/auth/change-password/",
        { method: "POST", body: passwordForm },
        token
      );
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setInfo(response?.message || "Password changed.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to change password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={14} color={palette.slate700} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {info ? <Text style={styles.info}>{info}</Text> : null}

          <View style={styles.card}>
            <Text style={styles.title}>Theme</Text>
            <View style={styles.row}>
              {THEME_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setTheme(option)}
                  style={[styles.themeChip, theme === option && styles.themeChipActive]}
                >
                  <Text style={[styles.themeText, theme === option && styles.themeTextActive]}>{option}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.saveBtn} onPress={saveTheme} disabled={themeSaving}>
              <Text style={styles.saveText}>{themeSaving ? "Saving..." : "Save Theme"}</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Change Password</Text>
            {!isPasswordRequired ? (
              <Text style={styles.helper}>You signed in with Google, current password is optional.</Text>
            ) : null}
            {isPasswordRequired ? (
              <TextInput
                value={passwordForm.current_password}
                onChangeText={(value) => setPasswordForm((prev) => ({ ...prev, current_password: value }))}
                secureTextEntry
                placeholder="Current password"
                style={styles.input}
              />
            ) : null}
            <TextInput
              value={passwordForm.new_password}
              onChangeText={(value) => setPasswordForm((prev) => ({ ...prev, new_password: value }))}
              secureTextEntry
              placeholder="New password"
              style={styles.input}
            />
            <TextInput
              value={passwordForm.confirm_password}
              onChangeText={(value) => setPasswordForm((prev) => ({ ...prev, confirm_password: value }))}
              secureTextEntry
              placeholder="Confirm new password"
              style={styles.input}
            />
            <Pressable style={styles.darkBtn} onPress={changePassword} disabled={passwordSaving}>
              <Text style={styles.darkBtnText}>{passwordSaving ? "Updating..." : "Change Password"}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 16, paddingBottom: 24, gap: 12 },
  backBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.slate300,
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backText: { color: palette.slate700, fontWeight: "700", fontSize: 12 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.slate200,
    backgroundColor: "rgba(255,255,255,0.85)",
    padding: 14,
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: "800", color: palette.slate900 },
  row: { flexDirection: "row", gap: 8 },
  themeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.slate300,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: palette.white,
  },
  themeChipActive: { borderColor: palette.blue600, backgroundColor: palette.blue100 },
  themeText: { color: palette.slate700, fontWeight: "700", textTransform: "capitalize" },
  themeTextActive: { color: palette.blue700 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.slate300,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: palette.white,
    color: palette.slate900,
  },
  saveBtn: {
    borderRadius: 12,
    backgroundColor: palette.blue600,
    paddingVertical: 11,
    alignItems: "center",
  },
  saveText: { color: palette.white, fontWeight: "700", fontSize: 14 },
  darkBtn: {
    borderRadius: 12,
    backgroundColor: palette.slate900,
    paddingVertical: 11,
    alignItems: "center",
  },
  darkBtnText: { color: palette.white, fontWeight: "700", fontSize: 14 },
  helper: { color: palette.slate600, fontSize: 12 },
  error: { color: palette.red600, backgroundColor: "#fee2e2", borderRadius: 10, padding: 8, fontSize: 12 },
  info: { color: palette.emerald600, backgroundColor: "#dcfce7", borderRadius: 10, padding: 8, fontSize: 12 },
});
