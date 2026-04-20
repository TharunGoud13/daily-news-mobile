import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SOURCES } from "@/types/news";
import { useTheme } from "@/hooks/useColorScheme";
import { Spacing, FontSize, BorderRadius } from "@/constants/theme";

interface SourceFilterProps {
  active: string;
  onChange: (source: string) => void;
}

export default function SourceFilter({ active, onChange }: SourceFilterProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {SOURCES.map((s) => {
        const isActive = active === s.key;
        return (
          <TouchableOpacity
            key={s.key}
            onPress={() => onChange(s.key)}
            activeOpacity={0.7}
            style={[
              styles.chip,
              {
                backgroundColor: isActive ? s.color + "15" : "transparent",
                borderColor: isActive ? s.color : colors.border,
              },
            ]}
          >
            <Feather
              name={s.icon as keyof typeof Feather.glyphMap}
              size={13}
              color={isActive ? s.color : colors.textTertiary}
            />
            <Text
              style={[
                styles.chipText,
                { color: isActive ? s.color : colors.textTertiary },
              ]}
            >
              {s.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 5,
  },
  chipText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
  },
});
