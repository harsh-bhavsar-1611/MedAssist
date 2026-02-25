import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { GradientBackground } from "../components/GradientBackground";
import { palette } from "../theme/palette";

export function LandingScreen({ navigation }) {
  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <FontAwesome5 name="heartbeat" size={18} color={palette.white} />
          </View>
          <View>
            <Text style={styles.brand}>MedAssist</Text>
            <Text style={styles.caption}>AI Patient Interaction</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.kicker}>Faster Care Conversations</Text>
          <Text style={styles.title}>A smarter front desk for every patient question.</Text>
          <Text style={styles.subtitle}>
            Ask health questions, keep conversation history organized, and prepare better follow-ups.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Built for trust</Text>
          <Text style={styles.cardText}>Secure account access and a medical-first chat flow for patient support.</Text>
        </View>

        <View style={styles.actions}>
          <Pressable style={[styles.button, styles.primary]} onPress={() => navigation.navigate("Auth", { mode: "register" })}>
            <Text style={styles.primaryText}>Create account</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.secondary]} onPress={() => navigation.navigate("Auth", { mode: "login" })}>
            <Text style={styles.secondaryText}>Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: palette.slate900,
    justifyContent: "center",
    alignItems: "center",
  },
  brand: {
    fontSize: 20,
    fontWeight: "800",
    color: palette.slate900,
  },
  caption: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: palette.slate600,
    textTransform: "uppercase",
  },
  hero: {
    marginTop: 36,
    gap: 10,
  },
  kicker: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: palette.blue100,
    color: palette.blue700,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  title: {
    fontSize: 35,
    lineHeight: 42,
    fontWeight: "800",
    color: palette.slate900,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: palette.slate600,
  },
  card: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: palette.slate200,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 24,
    padding: 18,
    gap: 8,
  },
  cardTitle: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: palette.slate600,
    fontWeight: "700",
  },
  cardText: {
    fontSize: 15,
    color: palette.slate700,
    lineHeight: 22,
  },
  actions: {
    marginTop: "auto",
    marginBottom: 6,
    gap: 10,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: palette.slate900,
  },
  secondary: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.slate300,
  },
  primaryText: {
    color: palette.white,
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryText: {
    color: palette.slate900,
    fontWeight: "700",
    fontSize: 15,
  },
});
