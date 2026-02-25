import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { GradientBackground } from "../components/GradientBackground";
import { FormattedContent } from "../components/FormattedContent";
import { ApiError, apiFetch } from "../api/client";
import { palette } from "../theme/palette";
import { useAuth } from "../context/AuthContext";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export function ReportsScreen({ navigation }) {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/reports/", {}, token);
      const items = response?.data?.reports || [];
      setReports(items);
      if (!selectedReport && items.length) setSelectedReport(items[0]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const selectedId = selectedReport?.id;
  useEffect(() => {
    if (!selectedId) return;
    const loadDetail = async () => {
      try {
        const response = await apiFetch(`/api/reports/${selectedId}/`, {}, token);
        const detail = response?.data?.report;
        if (detail) setSelectedReport(detail);
      } catch {
        // ignore detail failures
      }
    };
    loadDetail();
  }, [selectedId, token]);

  const canAnalyze = useMemo(() => files.length > 0 && !analyzing, [files.length, analyzing]);

  const pickFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      type: ["application/pdf", "text/plain", "image/*"],
      copyToCacheDirectory: true,
    });
    if (!result.canceled) {
      setFiles(result.assets || []);
    }
  };

  const analyze = async () => {
    if (!files.length) return;
    setAnalyzing(true);
    setError("");
    setInfo("");
    try {
      const formData = new FormData();
      if (title.trim()) formData.append("title", title.trim());
      files.forEach((file) => {
        formData.append("files", {
          uri: file.uri,
          name: file.name || `report-${Date.now()}`,
          type: file.mimeType || "application/octet-stream",
        });
      });

      const response = await apiFetch(
        "/api/reports/analyze/",
        {
          method: "POST",
          body: formData,
        },
        token
      );

      const report = response?.data?.report;
      if (report) setSelectedReport(report);
      setTitle("");
      setFiles([]);
      setInfo(response?.message || "Report analyzed.");
      await loadReports();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not analyze report.");
    } finally {
      setAnalyzing(false);
    }
  };

  const deleteReport = async (reportId) => {
    setError("");
    setInfo("");
    try {
      await apiFetch(`/api/reports/${reportId}/`, { method: "DELETE" }, token);
      const next = reports.filter((r) => r.id !== reportId);
      setReports(next);
      if (selectedReport?.id === reportId) {
        setSelectedReport(next[0] || null);
      }
      setInfo("Report deleted.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete report.");
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
            <Text style={styles.title}>Analyze Medical Report</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="Optional title" style={styles.input} />
            <Pressable style={styles.selectBtn} onPress={pickFiles}>
              <Text style={styles.selectText}>{files.length ? `${files.length} file(s) selected` : "Choose files"}</Text>
            </Pressable>
            <Pressable style={[styles.saveBtn, !canAnalyze && styles.disabled]} onPress={analyze} disabled={!canAnalyze}>
              <Text style={styles.saveText}>{analyzing ? "Analyzing..." : "Analyze"}</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Reports History</Text>
              <Pressable style={styles.refreshBtn} onPress={loadReports}>
                <Text style={styles.refreshText}>{loading ? "..." : "Refresh"}</Text>
              </Pressable>
            </View>

            {reports.map((report) => (
              <View key={report.id} style={[styles.reportItem, selectedReport?.id === report.id && styles.reportItemActive]}>
                <Pressable onPress={() => setSelectedReport(report)} style={styles.reportMain}>
                  <Text style={styles.reportTitle} numberOfLines={1}>{report.title || `Report ${report.id}`}</Text>
                  <Text style={styles.reportMeta}>{formatDate(report.created_at)}</Text>
                </Pressable>
                <Pressable onPress={() => deleteReport(report.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={14} color="#dc2626" />
                </Pressable>
              </View>
            ))}

            {!reports.length ? <Text style={styles.muted}>No reports yet.</Text> : null}
          </View>

          {selectedReport ? (
            <View style={styles.card}>
              <Text style={styles.title}>{selectedReport.title || `Report ${selectedReport.id}`}</Text>
              <Text style={styles.reportMeta}>{formatDate(selectedReport.created_at)}</Text>
              <FormattedContent text={selectedReport.analysis || "No analysis available."} color={palette.slate900} />
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
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.slate200,
    backgroundColor: "rgba(255,255,255,0.85)",
    padding: 14,
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: "800", color: palette.slate900 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.slate300,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: palette.white,
    color: palette.slate900,
  },
  selectBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: palette.slate300,
    backgroundColor: palette.white,
    paddingVertical: 10,
    alignItems: "center",
  },
  selectText: { color: palette.slate700, fontWeight: "700", fontSize: 13 },
  saveBtn: {
    borderRadius: 12,
    backgroundColor: palette.blue600,
    paddingVertical: 11,
    alignItems: "center",
  },
  saveText: { color: palette.white, fontWeight: "700", fontSize: 14 },
  disabled: { opacity: 0.6 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  refreshBtn: { borderWidth: 1, borderColor: palette.slate300, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  refreshText: { color: palette.slate700, fontSize: 12, fontWeight: "700" },
  reportItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.slate200,
    backgroundColor: palette.white,
    padding: 10,
  },
  reportItemActive: { borderColor: palette.blue600, backgroundColor: palette.blue100 },
  reportMain: { flex: 1, paddingRight: 8 },
  reportTitle: { fontWeight: "700", color: palette.slate900, fontSize: 13 },
  reportMeta: { color: palette.slate600, fontSize: 11 },
  deleteBtn: { padding: 4 },
  muted: { color: palette.slate600, fontSize: 12 },
  error: { color: palette.red600, backgroundColor: "#fee2e2", borderRadius: 10, padding: 8, fontSize: 12 },
  info: { color: palette.emerald600, backgroundColor: "#dcfce7", borderRadius: 10, padding: 8, fontSize: 12 },
});
