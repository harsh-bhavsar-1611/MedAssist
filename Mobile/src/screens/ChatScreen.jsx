import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { GradientBackground } from "../components/GradientBackground";
import { FormattedContent } from "../components/FormattedContent";
import { apiFetch } from "../api/client";
import { palette } from "../theme/palette";
import { useAuth } from "../context/AuthContext";

let SpeechModule = null;
try {
  const speechPkg = require("expo-speech-recognition");
  SpeechModule = speechPkg.ExpoSpeechRecognitionModule;
} catch {
  SpeechModule = null;
}

function SessionChip({ active, title, onPress }) {
  return (
    <Pressable style={[styles.sessionChip, active && styles.sessionChipActive]} onPress={onPress}>
      <Text style={[styles.sessionChipText, active && styles.sessionChipTextActive]} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
}

function MessageBubble({ item }) {
  const isUser = item.sender === "user";
  return (
    <View style={[styles.messageRow, isUser ? styles.userRow : styles.botRow]}>
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
        {isUser ? (
          <Text style={[styles.messageText, styles.userText]}>{item.text}</Text>
        ) : (
          <FormattedContent text={item.text} color={palette.slate900} />
        )}
      </View>
    </View>
  );
}

export function ChatScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { token, user, logout } = useAuth();
  const messageListRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const userHasScrolledUpRef = useRef(false);
  const speechListenersRef = useRef([]);

  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [draft, setDraft] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sending, setSending] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState("");

  const stopTypingAnimation = useCallback(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    setIsBotTyping(false);
  }, []);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const result = await apiFetch("/api/sessions/", {}, token);
      setSessions(result?.data?.sessions || []);
    } catch (err) {
      setError(err?.message || "Failed to load sessions.");
    } finally {
      setLoadingSessions(false);
    }
  }, [token]);

  const loadHistory = useCallback(
    async (sessionId) => {
      stopTypingAnimation();
      if (!sessionId) {
        setMessages([]);
        return;
      }
      try {
        const result = await apiFetch(`/api/history/${sessionId}/`, {}, token);
        const normalized = (result?.data?.messages || []).map((msg, index) => ({
          id: msg.id || `${sessionId}-${index}`,
          text: msg.text ?? msg.message ?? "",
          sender: msg.sender || "bot",
        }));
        setMessages(normalized);
      } catch (err) {
        setError(err?.message || "Failed to load conversation.");
      }
    },
    [token, stopTypingAnimation]
  );

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    loadHistory(currentSessionId);
  }, [currentSessionId, loadHistory]);

  useEffect(() => {
    return () => {
      stopTypingAnimation();
      speechListenersRef.current.forEach((sub) => sub?.remove?.());
      speechListenersRef.current = [];
    };
  }, [stopTypingAnimation]);

  useEffect(() => {
    if (!SpeechModule || typeof SpeechModule.addListener !== "function") return;

    const subscriptions = [
      SpeechModule.addListener("start", () => setIsListening(true)),
      SpeechModule.addListener("end", () => setIsListening(false)),
      SpeechModule.addListener("result", (event) => {
        const transcript = event?.results?.[0]?.transcript || "";
        if (transcript) {
          setDraft(transcript);
        }
      }),
      SpeechModule.addListener("error", (event) => {
        setIsListening(false);
        setError(event?.message || "Voice typing failed.");
      }),
    ];

    speechListenersRef.current = subscriptions;

    return () => {
      subscriptions.forEach((sub) => sub?.remove?.());
      speechListenersRef.current = [];
    };
  }, []);

  const streamBotReply = useCallback(
    (fullReply) => {
      const replyText = (fullReply || "I could not generate a response.").trim() || "I could not generate a response.";
      const botId = `bot-${Date.now()}`;
      let index = 0;
      const chunkSize = 2;

      stopTypingAnimation();
      setIsBotTyping(true);
      setMessages((prev) => [...prev, { id: botId, sender: "bot", text: "" }]);

      typingIntervalRef.current = setInterval(() => {
        index += chunkSize;
        const nextText = replyText.slice(0, index);
        setMessages((prev) => prev.map((msg) => (msg.id === botId ? { ...msg, text: nextText } : msg)));

        if (index >= replyText.length) {
          stopTypingAnimation();
        }
      }, 18);
    },
    [stopTypingAnimation]
  );

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || sending || isBotTyping) return;

    setDraft("");
    setError("");
    setSending(true);
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, text, sender: "user" }]);

    try {
      const result = await apiFetch(
        "/api/chat/",
        {
          method: "POST",
          body: { message: text, session_id: currentSessionId },
        },
        token
      );

      const data = result?.data || {};
      const nextSessionId = data.session_id || currentSessionId;
      if (!currentSessionId && nextSessionId) setCurrentSessionId(nextSessionId);

      if (nextSessionId && data.session_title) {
        setSessions((prev) => {
          const exists = prev.some((session) => session.id === nextSessionId);
          if (!exists) return [{ id: nextSessionId, title: data.session_title }, ...prev];
          return prev.map((session) => (session.id === nextSessionId ? { ...session, title: data.session_title } : session));
        });
      }

      streamBotReply(data.reply);
    } catch (err) {
      setError(err?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const toggleVoiceTyping = async () => {
    if (!SpeechModule) {
      setError("Voice typing not available in this build.");
      return;
    }

    try {
      if (isListening) {
        SpeechModule.stop();
        return;
      }

      const permission = await SpeechModule.requestPermissionsAsync();
      if (!permission?.granted) {
        setError("Microphone permission is required for voice typing.");
        return;
      }

      setError("");
      SpeechModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: false,
        addsPunctuation: true,
      });
    } catch {
      setError("Could not start voice typing.");
    }
  };

  const userName = useMemo(() => user?.name || "MedAssist User", [user?.name]);

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView
          style={styles.safeArea}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 12}
        >
          <View style={styles.topBar}>
            <View style={styles.brandWrap}>
              <View style={styles.logoBadge}>
                <FontAwesome5 name="heartbeat" size={16} color={palette.white} />
              </View>
              <View>
                <Text style={styles.brand}>MedAssist</Text>
                <Text style={styles.meta}>Welcome, {userName}</Text>
              </View>
            </View>
            <Pressable style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </View>

          <View style={styles.quickRow}>
            <Pressable style={styles.quickBtn} onPress={() => navigation.navigate("Reports")}><Text style={styles.quickBtnText}>Reports</Text></Pressable>
            <Pressable style={styles.quickBtn} onPress={() => navigation.navigate("Profile")}><Text style={styles.quickBtnText}>Profile</Text></Pressable>
            <Pressable style={styles.quickBtn} onPress={() => navigation.navigate("Settings")}><Text style={styles.quickBtnText}>Settings</Text></Pressable>
            {user?.is_admin ? <Pressable style={styles.quickBtn} onPress={() => navigation.navigate("Admin")}><Text style={styles.quickBtnText}>Admin</Text></Pressable> : null}
          </View>

          <View style={styles.historyInline}>
            <View style={styles.historyInlineTop}>
              <Pressable style={styles.historyToggle} onPress={() => setShowHistory((prev) => !prev)}>
                <Text style={styles.historyToggleText}>History</Text>
                <Ionicons name={showHistory ? "chevron-up-outline" : "chevron-down-outline"} size={14} color={palette.slate700} />
              </Pressable>
              <Pressable style={styles.newChatBtn} onPress={() => setCurrentSessionId(null)}>
                <Text style={styles.newChatText}>+ New Chat</Text>
              </Pressable>
            </View>
            {showHistory ? (
              loadingSessions ? (
                <ActivityIndicator color={palette.blue600} />
              ) : (
                <FlatList
                  data={sessions}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.sessionList}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={({ item }) => <SessionChip active={item.id === currentSessionId} title={item.title || `Session ${item.id}`} onPress={() => setCurrentSessionId(item.id)} />}
                />
              )
            ) : null}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <FlatList
            ref={messageListRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <MessageBubble item={item} />}
            style={styles.chatList}
            contentContainerStyle={styles.messages}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              if (!userHasScrolledUpRef.current) messageListRef.current?.scrollToEnd({ animated: true });
            }}
            onScroll={(event) => {
              const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
              const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
              userHasScrolledUpRef.current = distanceFromBottom > 80;
            }}
            scrollEventThrottle={16}
            ListEmptyComponent={<Text style={styles.empty}>Start a conversation with your AI medical assistant.</Text>}
          />

          <View style={[styles.inputWrap, { marginBottom: 0 }]}> 
            <TextInput value={draft} onChangeText={setDraft} placeholder="Type your health question..." placeholderTextColor={palette.slate600} style={styles.input} multiline />
            <Pressable onPress={toggleVoiceTyping} style={[styles.micBtn, isListening && styles.micBtnActive]}>
              <Ionicons name={isListening ? "mic" : "mic-outline"} size={18} color={isListening ? palette.white : palette.slate700} />
            </Pressable>
            <Pressable onPress={sendMessage} disabled={sending || isBotTyping} style={[styles.sendBtn, (sending || isBotTyping) && styles.sendBtnDisabled]}>
              <Text style={styles.sendText}>{sending ? "..." : isBotTyping ? "Typing..." : "Send"}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topBar: { marginTop: 4, marginBottom: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBadge: { width: 38, height: 38, borderRadius: 12, backgroundColor: palette.slate900, alignItems: "center", justifyContent: "center" },
  brand: { fontSize: 22, fontWeight: "800", color: palette.slate900, fontFamily: Platform.OS === "android" ? "sans-serif-medium" : undefined },
  meta: { color: palette.slate600, fontSize: 12, fontFamily: Platform.OS === "android" ? "sans-serif" : undefined },
  logoutBtn: { borderRadius: 12, borderWidth: 1, borderColor: palette.slate300, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "rgba(255,255,255,0.8)" },
  logoutText: { color: palette.slate900, fontWeight: "700", fontSize: 13 },
  quickRow: { flexDirection: "row", gap: 8, marginBottom: 6, flexWrap: "wrap" },
  quickBtn: { borderRadius: 999, borderWidth: 1, borderColor: palette.slate300, backgroundColor: "rgba(255,255,255,0.75)", paddingHorizontal: 10, paddingVertical: 6 },
  quickBtnText: { color: palette.slate700, fontSize: 12, fontWeight: "700" },
  historyInline: { gap: 6, marginBottom: 8 },
  historyInlineTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  historyToggle: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: palette.slate300, backgroundColor: "rgba(255,255,255,0.75)", flexDirection: "row", alignItems: "center", gap: 4 },
  historyToggleText: { fontSize: 12, color: palette.slate600, fontWeight: "700" },
  newChatBtn: { borderRadius: 999, backgroundColor: palette.slate900, paddingHorizontal: 12, paddingVertical: 7 },
  newChatText: { color: palette.white, fontSize: 12, fontWeight: "700" },
  sessionList: { gap: 8, paddingVertical: 1, paddingHorizontal: 2 },
  sessionChip: { maxWidth: 180, borderRadius: 999, borderWidth: 1, borderColor: palette.slate300, backgroundColor: "rgba(255,255,255,0.8)", paddingHorizontal: 12, paddingVertical: 7 },
  sessionChipActive: { borderColor: palette.blue600, backgroundColor: palette.blue100 },
  sessionChipText: { color: palette.slate700, fontSize: 12, fontWeight: "600" },
  sessionChipTextActive: { color: palette.blue700 },
  error: { marginTop: 2, color: palette.red600, backgroundColor: "#fee2e2", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12 },
  chatList: { flex: 1, minHeight: 0 },
  messages: { flexGrow: 1, paddingTop: 8, paddingBottom: 4, gap: 12 },
  empty: { textAlign: "center", color: palette.slate600, marginTop: 24, fontSize: 14 },
  messageRow: { flexDirection: "row" },
  userRow: { justifyContent: "flex-end" },
  botRow: { justifyContent: "flex-start" },
  messageBubble: { maxWidth: "85%", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10 },
  userBubble: { backgroundColor: palette.slate900 },
  botBubble: { backgroundColor: "rgba(255,255,255,0.86)", borderWidth: 1, borderColor: palette.slate200 },
  messageText: { fontSize: 14, lineHeight: 20 },
  userText: { color: palette.white },
  botText: { color: palette.slate900 },
  inputWrap: { borderRadius: 20, borderWidth: 1, borderColor: palette.slate300, backgroundColor: "rgba(255,255,255,0.85)", padding: 8, flexDirection: "row", alignItems: "flex-end", gap: 8 },
  input: { flex: 1, maxHeight: 96, color: palette.slate900, fontSize: 14, paddingHorizontal: 8, paddingVertical: 8 },
  micBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: palette.slate300, backgroundColor: palette.white, alignItems: "center", justifyContent: "center" },
  micBtnActive: { backgroundColor: palette.blue600, borderColor: palette.blue600 },
  sendBtn: { borderRadius: 12, backgroundColor: palette.blue600, paddingHorizontal: 14, paddingVertical: 10 },
  sendBtnDisabled: { opacity: 0.6 },
  sendText: { color: palette.white, fontSize: 13, fontWeight: "700" },
});
