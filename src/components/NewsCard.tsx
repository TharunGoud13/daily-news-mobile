import React, { useCallback } from "react";
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
  compact?: boolean;
}

const sourceColors: Record<string, string> = {
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
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return `${Math.floor(diff / 604800)}w`;
}

export default function NewsCard({
  article,
  isSaved,
  onSave,
  onUnsave,
  compact = false,
}: NewsCardProps) {
  const { colors, isDark } = useTheme();

  const handlePress = useCallback(async () => {
    await WebBrowser.openBrowserAsync(article.url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      toolbarColor: isDark ? "#0a0a0a" : "#ffffff",
    });
  }, [article.url, isDark]);

  const handleSave = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSaved) {
      onUnsave(article.id);
    } else {
      onSave(article);
    }
  }, [article, isSaved, onSave, onUnsave]);

  const handleShare = useCallback(async () => {
    await Share.share({
      title: article.title,
      url: article.url,
      message: `${article.title}\n${article.url}`,
    });
  }, [article]);

  const sourceColor = sourceColors[article.source] || "#6366f1";

  if (compact) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={[styles.compactCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
      >
        <View style={[styles.sourceIndicator, { backgroundColor: sourceColor }]} />
        <View style={styles.compactContent}>
          <Text style={[styles.compactTitle, { color: colors.text }]} numberOfLines={2}>
            {article.title}
          </Text>
          <View style={styles.compactMeta}>
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>
              {article.sourceName}
            </Text>
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>
              {timeAgo(article.publishedAt)}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleSave} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather
            name={isSaved ? "bookmark" : "bookmark"}
            size={18}
            color={isSaved ? colors.primary : colors.textTertiary}
            style={isSaved ? { opacity: 1 } : { opacity: 0.5 }}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
    >
      {/* Header: source badge + time */}
      <View style={styles.header}>
        <View style={[styles.sourceBadge, { backgroundColor: sourceColor + "20" }]}>
          <View style={[styles.sourceDot, { backgroundColor: sourceColor }]} />
          <Text style={[styles.sourceText, { color: sourceColor }]}>
            {article.sourceName}
          </Text>
        </View>
        <Text style={[styles.timeText, { color: colors.textTertiary }]}>
          {timeAgo(article.publishedAt)}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.body}>
        <View style={styles.textContent}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={3}>
            {article.title}
          </Text>
          {article.description ? (
            <Text
              style={[styles.description, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {article.description}
            </Text>
          ) : null}
        </View>
        {article.imageUrl ? (
          <Image
            source={{ uri: article.imageUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : null}
      </View>

      {/* Tags */}
      {article.tags.length > 0 && (
        <View style={styles.tags}>
          {article.tags.slice(0, 3).map((tag) => (
            <View
              key={tag}
              style={[styles.tag, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                #{tag}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer: stats + actions */}
      <View style={styles.footer}>
        <View style={styles.stats}>
          {article.score > 0 && (
            <View style={styles.stat}>
              <Feather name="arrow-up" size={12} color={colors.textTertiary} />
              <Text style={[styles.statText, { color: colors.textTertiary }]}>
                {article.score}
              </Text>
            </View>
          )}
          {article.commentsCount > 0 && (
            <View style={styles.stat}>
              <Feather name="message-circle" size={12} color={colors.textTertiary} />
              <Text style={[styles.statText, { color: colors.textTertiary }]}>
                {article.commentsCount}
              </Text>
            </View>
          )}
          {article.author && article.author !== "unknown" && (
            <Text
              style={[styles.authorText, { color: colors.textTertiary }]}
              numberOfLines={1}
            >
              {article.author}
            </Text>
          )}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={handleShare}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.actionBtn}
          >
            <Feather name="share" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.actionBtn}
          >
            <Feather
              name="bookmark"
              size={16}
              color={isSaved ? colors.primary : colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

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
  sourceBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  sourceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  sourceText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
  },
  timeText: {
    fontSize: FontSize.xs,
  },
  body: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: "600",
    lineHeight: 22,
    marginBottom: 4,
  },
  description: {
    fontSize: FontSize.sm,
    lineHeight: 18,
    marginTop: 4,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.md,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: FontSize.xs,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  statText: {
    fontSize: FontSize.xs,
  },
  authorText: {
    fontSize: FontSize.xs,
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  actionBtn: {
    padding: 4,
  },
  // Compact card styles
  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  sourceIndicator: {
    width: 3,
    height: 36,
    borderRadius: 2,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    lineHeight: 18,
  },
  compactMeta: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: 4,
  },
  metaText: {
    fontSize: FontSize.xs,
  },
});
