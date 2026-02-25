import React, { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { GradientBackground } from "../components/GradientBackground";
import { gradients, palette } from "../theme/palette";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";

export function AuthScreen({ route, navigation }) {
  const initial = route?.params?.mode === "register" ? "register" : "login";
  const [mode, setMode] = useState(initial);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login, register } = useAuth();
  const canSubmit = useMemo(() => email.trim() && password.trim(), [email, password]);

  const submit = async () => {
    setLoading(true);
    setError("");
    setInfo("");
    try {
      if (mode === "register") {
        await register({ name, email, password, confirmPassword });
        setInfo("Registration successful. Please login.");
        setMode("login");
        setPassword("");
        setConfirmPassword("");
      } else {
        await login({ email, password });
      }
    } catch (err) {
      setError(err?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.safeArea} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Pressable onPress={() => navigation.goBack()}>
              <Text style={styles.back}>Back</Text>
            </Pressable>

            <View style={styles.card}>
              <Text style={styles.kicker}>MedAssist</Text>
              <Text style={styles.title}>{mode === "login" ? "Login to MedAssist" : "Register for MedAssist"}</Text>
              <Text style={styles.subtitle}>
                {mode === "login" ? "Continue your patient conversations." : "Create your account to get started."}
              </Text>

              <View style={styles.switchRow}>
                <Pressable style={[styles.switchItem, mode === "login" && styles.switchActive]} onPress={() => setMode("login")}>
                  <Text style={[styles.switchText, mode === "login" && styles.switchTextActive]}>Login</Text>
                </Pressable>
                <Pressable
                  style={[styles.switchItem, mode === "register" && styles.switchActive]}
                  onPress={() => setMode("register")}
                >
                  <Text style={[styles.switchText, mode === "register" && styles.switchTextActive]}>Register</Text>
                </Pressable>
              </View>

              {mode === "register" && (
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Full name"
                  style={styles.input}
                  placeholderTextColor={palette.slate600}
                />
              )}
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Email address"
                style={styles.input}
                placeholderTextColor={palette.slate600}
              />

              <View style={styles.passwordWrap}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Password"
                  style={[styles.input, styles.passwordInput]}
                  placeholderTextColor={palette.slate600}
                />
                <Pressable style={styles.eyeButton} onPress={() => setShowPassword((prev) => !prev)}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={palette.slate600} />
                </Pressable>
              </View>

              {mode === "register" && (
                <View style={styles.passwordWrap}>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    placeholder="Confirm password"
                    style={[styles.input, styles.passwordInput]}
                    placeholderTextColor={palette.slate600}
                  />
                  <Pressable style={styles.eyeButton} onPress={() => setShowConfirmPassword((prev) => !prev)}>
                    <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={18} color={palette.slate600} />
                  </Pressable>
                </View>
              )}

              {error ? <Text style={styles.error}>{error}</Text> : null}
              {info ? <Text style={styles.info}>{info}</Text> : null}

              <Pressable disabled={loading || !canSubmit} onPress={submit} style={styles.submitWrap}>
                <LinearGradient colors={gradients.button} style={[styles.submit, (loading || !canSubmit) && styles.submitDisabled]}>
                  <Text style={styles.submitText}>{loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  back: {
    marginTop: 4,
    color: palette.slate700,
    fontSize: 14,
    fontWeight: "700",
  },
  card: {
    marginTop: 18,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
    backgroundColor: "rgba(255,255,255,0.82)",
    padding: 18,
    gap: 10,
  },
  kicker: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: palette.blue100,
    color: palette.blue700,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: palette.slate900,
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: palette.slate600,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.slate200,
    backgroundColor: palette.white,
    padding: 4,
    gap: 4,
    marginVertical: 2,
  },
  switchItem: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  switchActive: {
    backgroundColor: palette.slate900,
  },
  switchText: {
    color: palette.slate600,
    fontWeight: "700",
  },
  switchTextActive: {
    color: palette.white,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.slate300,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: palette.white,
    color: palette.slate900,
    fontSize: 14,
  },
  passwordWrap: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    color: palette.red600,
    backgroundColor: "#fee2e2",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    fontSize: 13,
  },
  info: {
    color: palette.emerald600,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    fontSize: 13,
  },
  submitWrap: {
    marginTop: 4,
  },
  submit: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitDisabled: {
    opacity: 0.55,
  },
  submitText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: "700",
  },
});
