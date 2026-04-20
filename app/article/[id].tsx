import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { useTheme } from "@/hooks/useColorScheme";
import { Spacing, FontSize } from "@/constants/theme";

export default function ArticleScreen() {
  const { colors, isDark } = useTheme();
  const { id, url, title } = useLocalSearchParams<{
    id: string;
    url: string;
    title: string;
  }>();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {title || "Article"}
        </Text>
        <View style={{ width: 36 }} />
      </View>
      {url ? (
        <WebView
          source={{ uri: url as string }}
          style={{ flex: 1, backgroundColor: colors.background }}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <Text style={{ color: colors.textSecondary }}>Loading...</Text>
            </View>
          )}
        />
      ) : (
        <View style={styles.error}>
          <Text style={{ color: colors.textSecondary }}>No URL provided</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    gap: Spacing.sm,
  },
  backBtn: {
    padding: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: "500",
    textAlign: "center",
  },
  loading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
