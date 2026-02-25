import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { palette } from "../theme/palette";

function inlineParts(text) {
  const parts = String(text || "").split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    const strong = part.match(/^\*\*([^*]+)\*\*$/);
    if (strong) {
      return (
        <Text key={`b-${idx}`} style={styles.bold}>
          {strong[1]}
        </Text>
      );
    }
    return (
      <Text key={`n-${idx}`} style={styles.normal}>
        {part}
      </Text>
    );
  });
}

function cleanLine(line) {
  return String(line || "").replace(/^#{1,6}\s*/, "").trim();
}

export function FormattedContent({ text, color = palette.slate900 }) {
  const lines = String(text || "")
    .split("\n")
    .map((line) => cleanLine(line))
    .filter((line) => line.length > 0);

  if (!lines.length) {
    return <Text style={[styles.lineText, { color }]} />;
  }

  return (
    <View style={styles.wrap}>
      {lines.map((line, idx) => {
        const bullet = line.match(/^[-*•]\s+(.+)$/);
        const ordered = line.match(/^(\d+)[.)]\s+(.+)$/);

        if (bullet) {
          return (
            <View key={`l-${idx}`} style={styles.row}>
              <Text style={[styles.bullet, { color }]}>•</Text>
              <Text style={[styles.lineText, { color }]}>{inlineParts(bullet[1])}</Text>
            </View>
          );
        }

        if (ordered) {
          return (
            <View key={`l-${idx}`} style={styles.row}>
              <Text style={[styles.bullet, { color }]}>{ordered[1]}.</Text>
              <Text style={[styles.lineText, { color }]}>{inlineParts(ordered[2])}</Text>
            </View>
          );
        }

        return (
          <Text key={`l-${idx}`} style={[styles.lineText, { color }]}>
            {inlineParts(line)}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  bullet: {
    minWidth: 14,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  lineText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  normal: {
    fontWeight: "400",
  },
  bold: {
    fontWeight: "700",
  },
});
