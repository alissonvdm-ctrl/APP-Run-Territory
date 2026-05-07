import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useData } from "@/contexts/DataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDistance, formatDuration, formatArea } from "@/lib/territory";
import { LANGUAGE_OPTIONS, Language } from "@/lib/i18n";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = Colors.dark;
  const { stats, territories } = useData();
  const { t, language, setLanguage } = useLanguage();

  const avgDistance =
    stats.totalRuns > 0 ? stats.totalDistance / stats.totalRuns : 0;
  const avgDuration =
    stats.totalRuns > 0 ? stats.totalDuration / stats.totalRuns : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <LinearGradient
            colors={[colors.tint + "20", "transparent"]}
            style={styles.avatarGradient}
          >
            <View style={[styles.avatar, { backgroundColor: colors.surface, borderColor: colors.tint }]}>
              <Ionicons name="person" size={40} color={colors.tint} />
            </View>
          </LinearGradient>
          <Text style={[styles.name, { color: colors.text }]}>{t.profile.runner}</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            {t.profile.tagline}
          </Text>
        </View>

        <View style={styles.highlightRow}>
          <HighlightCard
            icon="walk"
            value={stats.totalRuns.toString()}
            label={t.profile.totalRuns}
            color={colors.tint}
          />
          <HighlightCard
            icon="flag"
            value={territories.length.toString()}
            label={t.profile.territories}
            color={colors.accent}
          />
          <HighlightCard
            icon="flame"
            value={stats.totalCalories.toString()}
            label={t.profile.caloriesLabel}
            color={colors.warning}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t.profile.runningStats}
        </Text>
        <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <StatRow
            icon="speedometer"
            label={t.profile.totalDistance}
            value={formatDistance(stats.totalDistance)}
            color={colors.tint}
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <StatRow
            icon="time"
            label={t.profile.totalTime}
            value={formatDuration(stats.totalDuration)}
            color={colors.accentLight}
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <StatRow
            icon="trending-up"
            label={t.profile.longestRun}
            value={formatDistance(stats.longestRun)}
            color={colors.success}
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <StatRow
            icon="flash"
            label={t.profile.bestPace}
            value={
              stats.fastestPace > 0
                ? `${Math.floor(stats.fastestPace)}:${Math.round(
                    (stats.fastestPace % 1) * 60
                  )
                    .toString()
                    .padStart(2, "0")} /km`
                : "--"
            }
            color={colors.warning}
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <StatRow
            icon="analytics"
            label={t.profile.avgDistance}
            value={formatDistance(avgDistance)}
            color={colors.textSecondary}
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <StatRow
            icon="timer"
            label={t.profile.avgDuration}
            value={formatDuration(avgDuration)}
            color={colors.textSecondary}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t.profile.territoryStats}
        </Text>
        <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <StatRow
            icon="map"
            label={t.profile.totalAreaLabel}
            value={formatArea(stats.totalArea)}
            color={colors.tint}
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <StatRow
            icon="flag"
            label={t.profile.territoriesClaimedLabel}
            value={stats.totalTerritories.toString()}
            color={colors.accent}
          />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <StatRow
            icon="resize"
            label={t.profile.avgTerritorySize}
            value={
              stats.totalTerritories > 0
                ? formatArea(stats.totalArea / stats.totalTerritories)
                : "--"
            }
            color={colors.textSecondary}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t.profile.language}
        </Text>
        <View style={[styles.langCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {LANGUAGE_OPTIONS.map((opt, i) => (
            <React.Fragment key={opt.key}>
              {i > 0 && <View style={[styles.separator, { backgroundColor: colors.border }]} />}
              <Pressable
                onPress={() => setLanguage(opt.key as Language)}
                style={({ pressed }) => [styles.langRow, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={[styles.langLabel, { color: colors.text }]}>{opt.label}</Text>
                {language === opt.key && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.tint} />
                )}
              </Pressable>
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function HighlightCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: string;
  label: string;
  color: string;
}) {
  const colors = Colors.dark;
  return (
    <View
      style={[
        highlightStyles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={[highlightStyles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[highlightStyles.label, { color: colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

function StatRow({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  const colors = Colors.dark;
  return (
    <View style={statStyles.row}>
      <View style={statStyles.left}>
        <View style={[statStyles.iconBg, { backgroundColor: color + "15" }]}>
          <Ionicons name={icon as any} size={18} color={color} />
        </View>
        <Text style={[statStyles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      </View>
      <Text style={[statStyles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const highlightStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  value: {
    fontFamily: "Outfit_700Bold",
    fontSize: 22,
  },
  label: {
    fontFamily: "Outfit_400Regular",
    fontSize: 11,
    textAlign: "center",
  },
});

const statStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
  },
  value: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 15,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  name: {
    fontFamily: "Outfit_700Bold",
    fontSize: 24,
    marginTop: 12,
  },
  tagline: {
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    marginTop: 2,
  },
  highlightRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 18,
    marginBottom: 12,
  },
  statsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 24,
  },
  separator: {
    height: 1,
    marginLeft: 60,
  },
  langCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 24,
  },
  langRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  langLabel: {
    fontFamily: "Outfit_400Regular",
    fontSize: 15,
  },
});
