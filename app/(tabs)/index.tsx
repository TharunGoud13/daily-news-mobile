import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NewsArticle, Category, CATEGORIES } from "@/types/news";
import { fetchAllNews } from "@/services/newsApi";
import {
  saveArticle,
  unsaveArticle,
  getSavedArticleIds,
} from "@/services/savedArticles";
import NewsCard from "@/components/NewsCard";
import CategoryChips from "@/components/CategoryChips";
import SourceFilter from "@/components/SourceFilter";
import SearchBar from "@/components/SearchBar";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { useTheme } from "@/hooks/useColorScheme";
import { Spacing, FontSize } from "@/constants/theme";

export default function FeedScreen() {
  const { colors } = useTheme();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState<Category>("all");
  const [source, setSource] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const loadNews = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [news, ids] = await Promise.all([
        fetchAllNews(source),
        getSavedArticleIds(),
      ]);
      setArticles(news);
      setSavedIds(ids);
    } catch {
      setError("Failed to load news. Pull to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [source]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const handleSave = useCallback(async (article: NewsArticle) => {
    const success = await saveArticle(article);
    if (success) {
      setSavedIds((prev) => new Set([...prev, article.id]));
    }
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

  const filteredArticles = useMemo(() => {
    let filtered = articles;

    if (category !== "all") {
      const catConfig = CATEGORIES.find((c) => c.key === category);
      if (catConfig) {
        const keywords = catConfig.keywords.map((k) => k.toLowerCase());
        filtered = filtered.filter((article) => {
          const text =
            `${article.title} ${article.description} ${article.tags.join(" ")} ${article.sourceName}`.toLowerCase();
          return keywords.some((kw) => text.includes(kw));
        });
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((article) => {
        const text =
          `${article.title} ${article.description} ${article.tags.join(" ")}`.toLowerCase();
        return text.includes(q);
      });
    }

    return filtered;
  }, [articles, category, searchQuery]);

  const renderItem = useCallback(
    ({ item }: { item: NewsArticle }) => (
      <View style={styles.cardWrapper}>
        <NewsCard
          article={item}
          isSaved={savedIds.has(item.id)}
          onSave={handleSave}
          onUnsave={handleUnsave}
        />
      </View>
    ),
    [savedIds, handleSave, handleUnsave]
  );

  const ListHeader = useMemo(
    () => (
      <View>
        {/* App Header */}
        <View style={styles.appHeader}>
          <View>
            <Text style={[styles.appTitle, { color: colors.text }]}>
              Daily News
            </Text>
            <Text style={[styles.appSubtitle, { color: colors.textSecondary }]}>
              AI, Dev & Tech — all in one feed
            </Text>
          </View>
          <View style={[styles.liveIndicator, { backgroundColor: colors.success + "20" }]}>
            <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.liveText, { color: colors.success }]}>Live</Text>
          </View>
        </View>

        {/* Search */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search articles, topics, sources..."
        />

        {/* Categories */}
        <CategoryChips active={category} onChange={setCategory} />

        {/* Sources */}
        <SourceFilter active={source} onChange={setSource} />

        {/* Count */}
        {!loading && (
          <View style={styles.countRow}>
            <Text style={[styles.countText, { color: colors.textTertiary }]}>
              {filteredArticles.length} articles
            </Text>
          </View>
        )}
      </View>
    ),
    [colors, searchQuery, category, source, loading, filteredArticles.length]
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {ListHeader}
        <LoadingSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredArticles}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              {error || "No articles found"}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
              {error
                ? "Pull down to retry"
                : "Try a different category or search"}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadNews(true)}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={8}
        maxToRenderPerBatch={5}
        windowSize={10}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  appHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  appTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
  },
  appSubtitle: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
  },
  countRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  countText: {
    fontSize: FontSize.xs,
    fontWeight: "500",
  },
  cardWrapper: {
    paddingHorizontal: Spacing.lg,
  },
  empty: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: "600",
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    marginTop: 4,
  },
});
