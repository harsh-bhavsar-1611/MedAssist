import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { GradientBackground } from "../components/GradientBackground";
import { ApiError, apiFetch } from "../api/client";
import { palette } from "../theme/palette";
import { useAuth } from "../context/AuthContext";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
};

export function ProfileScreen({ navigation }) {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    birth_date: "",
    gender: "prefer_not_to_say",
    date_created: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await apiFetch("/api/auth/profile/", {}, token);
        const p = response?.data?.profile;
        if (!p) throw new Error("Profile missing");
        setForm({
          name: p.name || "",
          email: p.email || "",
          birth_date: p.birth_date || "",
          gender: p.gender || "prefer_not_to_say",
          date_created: p.date_created || "",
        });
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const save = async () => {
    setSaving(true);
    setError("");
    setInfo("");
    try {
      const response = await apiFetch(
        "/api/auth/profile/",
        {
          method: "PATCH",
          body: {
            name: form.name,
            birth_date: form.birth_date || null,
            gender: form.gender,
          },
        },
        token
      );
      const p = response?.data?.profile;
      if (p) {
        setForm((prev) => ({ ...prev, ...p, birth_date: p.birth_date || "" }));
      }
      setInfo(response?.message || "Profile updated.");
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
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

          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Profile</Text>
              <Pressable style={styles.editBtn} onPress={() => setEditing((prev) => !prev)}>
                <Text style={styles.editText}>{editing ? "Cancel" : "Edit"}</Text>
              </Pressable>
            </View>

            {loading ? <Text style={styles.muted}>Loading profile...</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {info ? <Text style={styles.info}>{info}</Text> : null}

            <Text style={styles.label}>Name</Text>
            <TextInput
              value={form.name}
              onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
              editable={editing}
              style={[styles.input, !editing && styles.disabledInput]}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput value={form.email} editable={false} style={[styles.input, styles.disabledInput]} />

            <Text style={styles.label}>Birth Date (YYYY-MM-DD)</Text>
            <TextInput
              value={form.birth_date || ""}
              onChangeText={(value) => setForm((prev) => ({ ...prev, birth_date: value }))}
              editable={editing}
              placeholder="1999-12-31"
              style={[styles.input, !editing && styles.disabledInput]}
            />

            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => editing && setForm((prev) => ({ ...prev, gender: option.value }))}
                  style={[
                    styles.genderChip,
                    form.gender === option.value && styles.genderChipActive,
                    !editing && styles.disabledInput,
                  ]}
                >
                  <Text style={[styles.genderChipText, form.gender === option.value && styles.genderChipTextActive]}>{option.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Member Since</Text>
            <TextInput value={formatDate(form.date_created)} editable={false} style={[styles.input, styles.disabledInput]} />

            {editing ? (
              <Pressable style={styles.saveBtn} onPress={save} disabled={saving}>
                <Text style={styles.saveText}>{saving ? "Saving..." : "Save Changes"}</Text>
              </Pressable>
            ) : null}
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
    gap: 8,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "800", color: palette.slate900 },
  editBtn: { borderRadius: 10, borderWidth: 1, borderColor: palette.slate300, paddingHorizontal: 10, paddingVertical: 6 },
  editText: { fontWeight: "700", color: palette.slate700, fontSize: 12 },
  muted: { color: palette.slate600, fontSize: 13 },
  label: { marginTop: 2, color: palette.slate600, fontWeight: "700", fontSize: 12 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.slate300,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: palette.white,
    color: palette.slate900,
    fontSize: 14,
  },
  disabledInput: { opacity: 0.75 },
  genderRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  genderChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.slate300,
    backgroundColor: palette.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  genderChipActive: { borderColor: palette.blue600, backgroundColor: palette.blue100 },
  genderChipText: { fontSize: 12, color: palette.slate700, fontWeight: "600" },
  genderChipTextActive: { color: palette.blue700 },
  saveBtn: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: palette.blue600,
    paddingVertical: 11,
    alignItems: "center",
  },
  saveText: { color: palette.white, fontWeight: "700", fontSize: 14 },
  error: { color: palette.red600, backgroundColor: "#fee2e2", borderRadius: 10, padding: 8, fontSize: 12 },
  info: { color: palette.emerald600, backgroundColor: "#dcfce7", borderRadius: 10, padding: 8, fontSize: 12 },
});
