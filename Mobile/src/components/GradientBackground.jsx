import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { gradients } from "../theme/palette";

export function GradientBackground({ children }) {
  return (
    <LinearGradient colors={gradients.page} style={styles.gradient}>
      <View style={styles.overlay}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 16,
  },
});
