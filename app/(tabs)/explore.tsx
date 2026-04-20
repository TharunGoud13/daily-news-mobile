import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { NewsArticle, Category, CATEGORIES } from "@/types/news";
import { fetchAllNews } from "@/services/newsApi";
import {
  saveArticle,
  unsaveArticle,
  getSavedArticleIds,
} from "@/services/savedArticles";
import NewsCard from "@/components/NewsCard";
import SearchBar from "@/components/SearchBar";
import { useTheme } from "@/hooks/useColorScheme";
import { Spacing, FontSize, BorderRadius } from "@/constants/theme";

export default function ExploreScreen() {
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const loadCategoryNews = useCallback(async (cat: Category) => {
    setLoading(true);
    try {
      const [news, ids] = await Promise.all([
        fetchAllNews(),
        getSavedArticleIds(),
      ]);
      const catConfig = CATEGORIES.find((c) => c.key === cat);
      if (catConfig && catConfig.keywords.length > 0) {
        const keywords = catConfig.keywords.map((k) => k.toLowerCase());
        const filtered = news.filter((article) => {
          const text =
            `${article.title} ${article.description} ${article.tags.join(" ")}`.toLowerCase();
          return keywords.some((kw) => text.includes(kw));
        });
        setArticles(filtered);
      } else {
        setArticles(news);
      }
      setSavedIds(ids);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadCategoryNews(selectedCategory);
    }
  }, [selectedCategory, loadCategoryNews]);

  useEffect(() => {
    getSavedArticleIds().then(setSavedIds);
  }, []);

  const handleSave = useCallback(async (article: NewsArticle) => {
    const success = await saveArticle(article);
    if (success) setSavedIds((prev) => new Set([...prev, article.id]));
  }, []);

  const handleUnsave = useCallback(async (articleId: string) => {
    const success = await unsaveArticle(articleId);
    if (success) {
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(articleId);
        return next;
      });
    }
  }, []);

  const filteredArticles = searchQuery.trim()
    ? articles.filter((a) => {
        const text = `${a.title} ${a.description} ${a.tags.join(" ")}`.toLowerCase();
        return text.includes(searchQuery.toLowerCase());
      })
    : articles;

  if (!selectedCategory) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Explore</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Dive deep into topics that matter to you
          </Text>
        </View>

        <FlatList
          data={CATEGORIES.filter((c) => c.key !== "all")}
          keyExtractor={(item) => item.key}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryCard,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}
              activeOpacity={0.7}
              onPress={() => setSelectedCategory(item.key)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: colors.primary + "15" }]}>
                <Feather
                  name={item.icon as keyof typeof Feather.glyphMap}
                  size={24}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.categoryLabel, { color: colors.text }]}>
                {item.label}
              </Text>
              <Text style={[styles.categoryKeywords, { color: colors.textTertiary }]}>
                {item.keywords.slice(0, 3).join(", ")}
              </Text>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    );
  }

  const currentCategory = CATEGORIES.find((c) => c.key === selectedCategory);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <View style={styles.categoryHeader}>
              <TouchableOpacity
                onPress={() => setSelectedCategory(null)}
                style={styles.backBtn}
              >
                <Feather name="arrow-left" size={20} color={colors.text} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[styles.categoryTitle, { color: colors.text }]}>
                  {currentCategory?.label}
                </Text>
                <Text style={[styles.categoryCount, { color: colors.textTertiary }]}>
                  {filteredArticles.length} articles
                </Text>
              </View>
            </View>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`Search in ${currentCategory?.label}...`}
            />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <NewsCard
              article={item}
              isSaved={savedIds.has(item.id)}
              onSave={handleSave}
              onUnsave={handleUnsave}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <>
                <Feather name="inbox" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No articles found for this topic
                </Text>
              </>
            )}
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadCategoryNews(selectedCategory);
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: FontSize.sm,
    marginTop: 4,
  },
  grid: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  gridRow: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  categoryCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  categoryLabel: {
    fontSize: FontSize.md,
    fontWeight: "600",
    marginBottom: 4,
  },
  categoryKeywords: {
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  backBtn: {
    padding: Spacing.sm,
  },
  categoryTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
  },
  categoryCount: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  cardWrapper: {
    paddingHorizontal: Spacing.lg,
  },
  empty: {
    paddingVertical: 80,
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
    marginTop: Spacing.sm,
  },
});
