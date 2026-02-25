import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { GradientBackground } from "../components/GradientBackground";
import { ApiError, apiFetch } from "../api/client";
import { palette } from "../theme/palette";
import { useAuth } from "../context/AuthContext";

export function AdminScreen({ navigation }) {
  const { token, user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [error, setError] = useState("");
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [health, setHealth] = useState(null);

  const loadOverview = async () => {
    try {
      const response = await apiFetch("/api/admin/overview/", {}, token);
      setOverview(response?.data || null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load overview.");
    }
  };

  const loadUsers = async () => {
    try {
      const response = await apiFetch("/api/admin/users/?page=1&page_size=20", {}, token);
      setUsers(response?.data?.users || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load users.");
    }
  };

  const loadHealth = async () => {
    try {
      const response = await apiFetch("/api/admin/health/", {}, token);
      setHealth(response?.data || null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load health.");
    }
  };

  useEffect(() => {
    if (!user?.is_admin) return;
    if (tab === "overview") loadOverview();
    if (tab === "users") loadUsers();
    if (tab === "health") loadHealth();
  }, [tab, user?.is_admin]);

  const toggleUser = async (targetUser, field, value) => {
    try {
      const response = await apiFetch(
        `/api/admin/users/${targetUser.id}/`,
        { method: "PATCH", body: { [field]: value } },
        token
      );
      const updated = response?.data?.user;
      if (updated) setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, ...updated } : u)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update user.");
    }
  };

  if (!user?.is_admin) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.accessCard}>
            <Text style={styles.deniedTitle}>Access Denied</Text>
            <Text style={styles.deniedText}>Admin access required.</Text>
            <Pressable style={styles.backBtnSolid} onPress={() => navigation.goBack()}>
              <Text style={styles.backBtnSolidText}>Back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={14} color={palette.slate700} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.tabs}>
            <Pressable style={[styles.tabBtn, tab === "overview" && styles.tabBtnActive]} onPress={() => setTab("overview")}><Text style={[styles.tabText, tab === "overview" && styles.tabTextActive]}>Overview</Text></Pressable>
            <Pressable style={[styles.tabBtn, tab === "users" && styles.tabBtnActive]} onPress={() => setTab("users")}><Text style={[styles.tabText, tab === "users" && styles.tabTextActive]}>Users</Text></Pressable>
            <Pressable style={[styles.tabBtn, tab === "health" && styles.tabBtnActive]} onPress={() => setTab("health")}><Text style={[styles.tabText, tab === "health" && styles.tabTextActive]}>Health</Text></Pressable>
          </View>

          {tab === "overview" ? (
            <View style={styles.card}>
              <Text style={styles.title}>Admin Overview</Text>
              <Text style={styles.metric}>Total Users: {overview?.metrics?.total_users ?? "-"}</Text>
              <Text style={styles.metric}>Active Users: {overview?.metrics?.active_users ?? "-"}</Text>
              <Text style={styles.metric}>Total Sessions: {overview?.metrics?.total_sessions ?? "-"}</Text>
              <Text style={styles.metric}>Total Messages: {overview?.metrics?.total_messages ?? "-"}</Text>
            </View>
          ) : null}

          {tab === "users" ? (
            <View style={styles.card}>
              <Text style={styles.title}>Users</Text>
              {users.map((u) => (
                <View key={u.id} style={styles.userRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{u.name}</Text>
                    <Text style={styles.userMeta}>{u.email}</Text>
                  </View>
                  <Pressable style={styles.smallBtn} onPress={() => toggleUser(u, "is_active", !u.is_active)}>
                    <Text style={styles.smallBtnText}>{u.is_active ? "Deactivate" : "Activate"}</Text>
                  </Pressable>
                  <Pressable style={styles.smallBtn} onPress={() => toggleUser(u, "is_staff", !u.is_staff)}>
                    <Text style={styles.smallBtnText}>{u.is_staff ? "Remove Admin" : "Make Admin"}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          {tab === "health" ? (
            <View style={styles.card}>
              <Text style={styles.title}>System Health</Text>
              <Text style={styles.metric}>Status: {health?.status || "-"}</Text>
              <Text style={styles.metric}>Database: {health?.checks?.database?.ok ? "OK" : "Issue"}</Text>
              <Text style={styles.metric}>Medical JSON: {health?.checks?.medical_json?.ok ? "OK" : "Issue"}</Text>
              <Text style={styles.metric}>Model Config: {health?.checks?.model_config?.ok ? "OK" : "Issue"}</Text>
            </View>
          ) : null}
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
  accessCard: {
    margin: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 16,
    gap: 8,
  },
  deniedTitle: { color: "#b91c1c", fontSize: 18, fontWeight: "800" },
  deniedText: { color: palette.slate700, fontSize: 14 },
  backBtnSolid: { alignSelf: "flex-start", backgroundColor: palette.slate900, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  backBtnSolidText: { color: palette.white, fontWeight: "700" },
  tabs: { flexDirection: "row", gap: 8 },
  tabBtn: { borderRadius: 999, borderWidth: 1, borderColor: palette.slate300, backgroundColor: "rgba(255,255,255,0.8)", paddingHorizontal: 12, paddingVertical: 7 },
  tabBtnActive: { borderColor: palette.blue600, backgroundColor: palette.blue100 },
  tabText: { color: palette.slate700, fontWeight: "700", fontSize: 12 },
  tabTextActive: { color: palette.blue700 },
  card: { borderRadius: 20, borderWidth: 1, borderColor: palette.slate200, backgroundColor: "rgba(255,255,255,0.85)", padding: 14, gap: 8 },
  title: { fontSize: 18, fontWeight: "800", color: palette.slate900 },
  metric: { fontSize: 14, color: palette.slate700 },
  userRow: { borderRadius: 12, borderWidth: 1, borderColor: palette.slate200, backgroundColor: palette.white, padding: 10, gap: 8 },
  userName: { fontWeight: "700", color: palette.slate900, fontSize: 13 },
  userMeta: { color: palette.slate600, fontSize: 11 },
  smallBtn: { borderRadius: 10, borderWidth: 1, borderColor: palette.slate300, paddingHorizontal: 10, paddingVertical: 6, alignItems: "center" },
  smallBtnText: { color: palette.slate700, fontSize: 12, fontWeight: "700" },
  error: { color: palette.red600, backgroundColor: "#fee2e2", borderRadius: 10, padding: 8, fontSize: 12 },
});
