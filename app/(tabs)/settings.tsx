import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useColorScheme";
import { Spacing, FontSize, BorderRadius } from "@/constants/theme";

interface SettingItemProps {
  icon: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

function SettingItem({ icon, label, subtitle, onPress, rightElement }: SettingItemProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: colors.primary + "15" }]}>
        <Feather name={icon as keyof typeof Feather.glyphMap} size={18} color={colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: colors.textTertiary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (
        onPress && <Feather name="chevron-right" size={18} color={colors.textTertiary} />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        </View>

        {/* App Info */}
        <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <View style={styles.appInfo}>
            <View style={[styles.appIcon, { backgroundColor: colors.primary }]}>
              <Feather name="zap" size={28} color="#fff" />
            </View>
            <View>
              <Text style={[styles.appName, { color: colors.text }]}>Daily News</Text>
              <Text style={[styles.appVersion, { color: colors.textTertiary }]}>
                Version 1.0.0
              </Text>
            </View>
          </View>
        </View>

        {/* News Sources */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          NEWS SOURCES
        </Text>
        <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <SettingItem
            icon="trending-up"
            label="Hacker News"
            subtitle="Top tech stories from YC"
          />
          <SettingItem
            icon="edit-3"
            label="Dev.to"
            subtitle="Developer community articles"
          />
          <SettingItem
            icon="globe"
            label="GNews"
            subtitle="AI & tech news from global outlets"
          />
          <SettingItem
            icon="monitor"
            label="Tech News RSS"
            subtitle="TechCrunch, VentureBeat, The Verge, Ars Technica"
          />
          <SettingItem
            icon="cpu"
            label="AI Official"
            subtitle="OpenAI, Google AI, WIRED, MIT Tech Review"
          />
          <SettingItem
            icon="award"
            label="Product Hunt"
            subtitle="New product launches"
          />
          <SettingItem
            icon="github"
            label="GitHub Trending"
            subtitle="Trending repositories"
          />
          <SettingItem
            icon="message-square"
            label="Reddit"
            subtitle="r/programming, r/MachineLearning, r/reactjs, r/webdev"
          />
        </View>

        {/* About */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          ABOUT
        </Text>
        <View style={[styles.section, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <SettingItem
            icon="github"
            label="Source Code"
            subtitle="View on GitHub"
            onPress={() => Linking.openURL("https://github.com/TharunGoud13/daily-news-mobile")}
          />
          <SettingItem
            icon="globe"
            label="Web Version"
            subtitle="daily-news-lilac-seven.vercel.app"
            onPress={() => Linking.openURL("https://daily-news-lilac-seven.vercel.app")}
          />
          <SettingItem
            icon="user"
            label="Developer"
            subtitle="Tharun Kumar Goud"
          />
        </View>

        <Text style={[styles.footer, { color: colors.textTertiary }]}>
          Built with Expo + React Native{"\n"}
          Powered by 8 news sources
        </Text>
      </ScrollView>
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
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  section: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  appInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    fontSize: FontSize.lg,
    fontWeight: "700",
  },
  appVersion: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 0.5,
    gap: Spacing.md,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: FontSize.md,
    fontWeight: "500",
  },
  settingSubtitle: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  footer: {
    textAlign: "center",
    fontSize: FontSize.xs,
    lineHeight: 18,
    paddingVertical: Spacing.xxxl,
  },
});
