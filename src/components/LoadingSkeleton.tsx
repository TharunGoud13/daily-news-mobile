import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useColorScheme";
import { Spacing, BorderRadius } from "@/constants/theme";

function SkeletonCard() {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border, opacity },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: colors.surface }]} />
        <View style={[styles.time, { backgroundColor: colors.surface }]} />
      </View>
      <View style={[styles.titleLine, { backgroundColor: colors.surface }]} />
      <View style={[styles.titleLine, { backgroundColor: colors.surface, width: "70%" }]} />
      <View style={[styles.descLine, { backgroundColor: colors.surface }]} />
      <View style={styles.footer}>
        <View style={[styles.stat, { backgroundColor: colors.surface }]} />
        <View style={[styles.stat, { backgroundColor: colors.surface }]} />
      </View>
    </Animated.View>
  );
}

export default function LoadingSkeleton() {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  badge: {
    width: 80,
    height: 20,
    borderRadius: BorderRadius.sm,
  },
  time: {
    width: 30,
    height: 14,
    borderRadius: BorderRadius.sm,
  },
  titleLine: {
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
    width: "100%",
  },
  descLine: {
    height: 12,
    borderRadius: 4,
    width: "90%",
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginTop: Spacing.lg,
  },
  stat: {
    width: 40,
    height: 14,
    borderRadius: 4,
  },
});
