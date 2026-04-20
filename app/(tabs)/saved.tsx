import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { SavedArticle } from "@/types/news";
import { getSavedArticles, unsaveArticle } from "@/services/savedArticles";
import NewsCard from "@/components/NewsCard";
import SearchBar from "@/components/SearchBar";
import { useTheme } from "@/hooks/useColorScheme";
import { Spacing, FontSize } from "@/constants/theme";

export default function SavedScreen() {
  const { colors } = useTheme();
  const [articles, setArticles] = useState<SavedArticle[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadSaved = useCallback(async () => {
    const saved = await getSavedArticles();
    setArticles(saved);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSaved();
    }, [loadSaved])
  );

  const handleUnsave = useCallback(
    async (articleId: string) => {
      Alert.alert("Remove Article", "Remove from saved articles?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const success = await unsaveArticle(articleId);
            if (success) {
              setArticles((prev) => prev.filter((a) => a.id !== articleId));
            }
          },
        },
      ]);
    },
    []
  );

  const filteredArticles = searchQuery.trim()
    ? articles.filter((a) => {
        const text = `${a.title} ${a.description} ${a.tags.join(" ")}`.toLowerCase();
        return text.includes(searchQuery.toLowerCase());
      })
    : articles;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Saved</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {articles.length} articles saved
                </Text>
              </View>
            </View>
            {articles.length > 0 && (
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search saved articles..."
              />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <NewsCard
              article={item}
              isSaved={true}
              onSave={() => {}}
              onUnsave={handleUnsave}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="bookmark" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              No saved articles yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
              Tap the bookmark icon on any article to save it here
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadSaved();
              setRefreshing(false);
            }}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  cardWrapper: {
    paddingHorizontal: Spacing.lg,
  },
  empty: {
    paddingVertical: 100,
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    textAlign: "center",
    paddingHorizontal: Spacing.xxxl,
  },
});
