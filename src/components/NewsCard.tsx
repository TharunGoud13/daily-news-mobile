import React, { memo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Share,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Haptics from "expo-haptics";
import { NewsArticle } from "@/types/news";
import { useTheme } from "@/hooks/useColorScheme";
import { Spacing, FontSize, BorderRadius } from "@/constants/theme";

interface NewsCardProps {
  article: NewsArticle;
  isSaved: boolean;
  onSave: (article: NewsArticle) => void;
  onUnsave: (articleId: string) => void;
}

const SOURCE_COLORS: Record<string, string> = {
  hackernews: "#f97316",
  devto: "#3b82f6",
  gnews: "#10b981",
  technews: "#a855f7",
  aiofficial: "#f43f5e",
  producthunt: "#ea580c",
  github: "#6b7280",
  reddit: "#ef4444",
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return `${Math.floor(diff / 604800)}w`;
}

function NewsCard({ article, isSaved, onSave, onUnsave }: NewsCardProps) {
  const { colors, isDark } = useTheme();
  const sourceColor = SOURCE_COLORS[article.source] || "#6366f1";

  const handlePress = useCallback(async () => {
    await WebBrowser.openBrowserAsync(article.url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      toolbarColor: isDark ? "#0a0a0a" : "#ffffff",
    });
  }, [article.url, isDark]);

  const handleSave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    isSaved ? onUnsave(article.id) : onSave(article);
  }, [article, isSaved, onSave, onUnsave]);

  const handleShare = useCallback(() => {
    Share.share({ title: article.title, url: article.url });
  }, [article]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
    >
      {/* Source + Time */}
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: sourceColor + "18" }]}>
          <View style={[styles.dot, { backgroundColor: sourceColor }]} />
          <Text style={[styles.badgeText, { color: sourceColor }]}>
            {article.sourceName}
          </Text>
        </View>
        <Text style={[styles.time, { color: colors.textTertiary }]}>
          {timeAgo(article.publishedAt)}
        </Text>
      </View>

      {/* Title + Image */}
      <View style={styles.body}>
        <View style={styles.textContent}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={3}>
            {article.title}
          </Text>
          {article.description ? (
            <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>
              {article.description}
            </Text>
          ) : null}
        </View>
        {article.imageUrl ? (
          <Image source={{ uri: article.imageUrl }} style={styles.thumb} />
        ) : null}
      </View>

      {/* Tags */}
      {article.tags.length > 0 && (
        <View style={styles.tags}>
          {article.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.surface }]}>
              <Text style={[styles.tagText, { color: colors.textSecondary }]}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.stats}>
          {article.score > 0 && (
            <View style={styles.stat}>
              <Feather name="arrow-up" size={11} color={colors.textTertiary} />
              <Text style={[styles.statText, { color: colors.textTertiary }]}>{article.score}</Text>
            </View>
          )}
          {article.commentsCount > 0 && (
            <View style={styles.stat}>
              <Feather name="message-circle" size={11} color={colors.textTertiary} />
              <Text style={[styles.statText, { color: colors.textTertiary }]}>{article.commentsCount}</Text>
            </View>
          )}
          {article.author !== "unknown" && (
            <Text style={[styles.author, { color: colors.textTertiary }]} numberOfLines={1}>
              {article.author}
            </Text>
          )}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleShare} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="share" size={15} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather
              name="bookmark"
              size={15}
              color={isSaved ? colors.primary : colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default memo(NewsCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dot: { width: 5, height: 5, borderRadius: 3, marginRight: 5 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  time: { fontSize: 11 },
  body: { flexDirection: "row", gap: 12 },
  textContent: { flex: 1 },
  title: { fontSize: 15, fontWeight: "600", lineHeight: 21 },
  desc: { fontSize: 13, lineHeight: 17, marginTop: 4 },
  thumb: { width: 64, height: 64, borderRadius: 10 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 8 },
  tag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 },
  tagText: { fontSize: 11 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  stats: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  stat: { flexDirection: "row", alignItems: "center", gap: 3 },
  statText: { fontSize: 11 },
  author: { fontSize: 11, flex: 1 },
  actions: { flexDirection: "row", gap: 16 },
});
