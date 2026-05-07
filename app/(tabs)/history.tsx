import React from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useData } from "@/contexts/DataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { RunHistoryItem } from "@/lib/types";
import { formatDistance, formatDuration } from "@/lib/territory";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const colors = Colors.dark;
  const { runs, removeRun } = useData();
  const { t, language } = useLanguage();

  const locale = language === "pt" ? "pt-BR" : "en-US";

  const handleDelete = (runId: string) => {
    if (Platform.OS === "web") {
      removeRun(runId);
      return;
    }
    Alert.alert(t.history.deleteRun, t.history.deleteRunConfirm, [
      { text: t.history.cancel, style: "cancel" },
      {
        text: t.history.delete,
        style: "destructive",
        onPress: () => removeRun(runId),
      },
    ]);
  };

  const renderRun = ({ item }: { item: RunHistoryItem }) => {
    const date = new Date(item.startTime);
    const dayStr = date.toLocaleDateString(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const timeStr = date.toLocaleTimeString(locale, {
      hour: "numeric",
      minute: "2-digit",
    });

    return (
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") Haptics.selectionAsync();
          router.push({ pathname: "/run-detail", params: { id: item.id } });
        }}
        onLongPress={() => handleDelete(item.id)}
        style={({ pressed }) => [
          styles.runCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <View style={styles.runCardTop}>
          <View style={styles.runCardDate}>
            <View style={[styles.runIcon, { backgroundColor: colors.tint + "20" }]}>
              <Ionicons name="walk" size={18} color={colors.tint} />
            </View>
            <View>
              <Text style={[styles.runDay, { color: colors.text }]}>{dayStr}</Text>
              <Text style={[styles.runTime, { color: colors.textMuted }]}>
                {timeStr}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>

        <View style={styles.runCardStats}>
          <View style={styles.runStat}>
            <Text style={[styles.runStatValue, { color: colors.text }]}>
              {formatDistance(item.distance)}
            </Text>
            <Text style={[styles.runStatLabel, { color: colors.textMuted }]}>
              {t.history.distanceLabel}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.runStat}>
            <Text style={[styles.runStatValue, { color: colors.text }]}>
              {formatDuration(item.duration)}
            </Text>
            <Text style={[styles.runStatLabel, { color: colors.textMuted }]}>
              {t.history.durationLabel}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.runStat}>
            <Text style={[styles.runStatValue, { color: colors.text }]}>
              {item.calories}
            </Text>
            <Text style={[styles.runStatLabel, { color: colors.textMuted }]}>
              {t.history.caloriesLabel}
            </Text>
          </View>
          {item.territoriesClaimed > 0 && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.runStat}>
                <Text style={[styles.runStatValue, { color: colors.tint }]}>
                  {item.territoriesClaimed}
                </Text>
                <Text style={[styles.runStatLabel, { color: colors.textMuted }]}>
                  {t.history.claimedLabel}
                </Text>
              </View>
            </>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12),
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>{t.history.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {runs.length} {runs.length === 1 ? t.history.runRecorded : t.history.runsRecorded}
        </Text>
      </View>

      <FlatList
        data={runs}
        keyExtractor={(item) => item.id}
        renderItem={renderRun}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!runs.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t.history.noRuns}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t.history.noRunsDesc}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontFamily: "Outfit_700Bold",
    fontSize: 28,
  },
  subtitle: {
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },
  runCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  runCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  runCardDate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  runIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  runDay: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 15,
  },
  runTime: {
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    marginTop: 1,
  },
  runCardStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  runStat: {
    flex: 1,
    alignItems: "center",
  },
  runStatValue: {
    fontFamily: "Outfit_700Bold",
    fontSize: 16,
  },
  runStatLabel: {
    fontFamily: "Outfit_400Regular",
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 28,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 18,
  },
  emptyText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
