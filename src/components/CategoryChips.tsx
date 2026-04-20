import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Category, CATEGORIES } from "@/types/news";
import { useTheme } from "@/hooks/useColorScheme";
import { Spacing, FontSize, BorderRadius } from "@/constants/theme";

interface CategoryChipsProps {
  active: Category;
  onChange: (cat: Category) => void;
}

export default function CategoryChips({ active, onChange }: CategoryChipsProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map((cat) => {
        const isActive = active === cat.key;
        return (
          <TouchableOpacity
            key={cat.key}
            onPress={() => onChange(cat.key)}
            activeOpacity={0.7}
            style={[
              styles.chip,
              {
                backgroundColor: isActive ? colors.primary : colors.surface,
                borderColor: isActive ? colors.primary : colors.border,
              },
            ]}
          >
            <Feather
              name={cat.icon as keyof typeof Feather.glyphMap}
              size={13}
              color={isActive ? "#fff" : colors.textSecondary}
            />
            <Text
              style={[
                styles.chipText,
                { color: isActive ? "#fff" : colors.textSecondary },
              ]}
            >
              {cat.label}
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
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 6,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: "500",
  },
});
