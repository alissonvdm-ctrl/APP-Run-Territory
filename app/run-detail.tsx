import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { DetailMap } from "@/components/NativeMap";
import Colors from "@/constants/colors";
import { useData } from "@/contexts/DataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDistance, formatDuration } from "@/lib/territory";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isWeb = Platform.OS === "web";

export default function RunDetailScreen() {
  const insets = useSafeAreaInsets();
  const colors = Colors.dark;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { runs } = useData();
  const { t, language } = useLanguage();

  const locale = language === "pt" ? "pt-BR" : "en-US";
  const run = runs.find((r) => r.id === id);

  if (!run) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + (isWeb ? 67 : 0) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.centered}>
          <Text style={[styles.notFound, { color: colors.textSecondary }]}>{t.detail.runNotFound}</Text>
        </View>
      </View>
    );
  }

  const routeCoords = run.coordinates.map((c) => ({ latitude: c.latitude, longitude: c.longitude }));
  const date = new Date(run.startTime);
  const dateStr = date.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const timeStr = date.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
  const avgSpeedKmh = run.avgSpeed * 3.6;
  const pace = run.distance > 0 ? run.duration / 60 / (run.distance / 1000) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + (isWeb ? 34 : 0) + 20 }} showsVerticalScrollIndicator={false}>
        <View style={{ height: SCREEN_WIDTH * 0.65 }}>
          {routeCoords.length > 1 ? (
            <DetailMap routeCoords={routeCoords} />
          ) : (
            <View style={[styles.noMap, { backgroundColor: colors.surface }]}>
              <Ionicons name="map-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.noMapText, { color: colors.textSecondary }]}>{t.detail.noRouteData}</Text>
            </View>
          )}
          <Pressable onPress={() => router.back()} style={[styles.backBtnOverlay, { top: insets.top + (isWeb ? 67 : 8), backgroundColor: colors.overlay }]}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>{dateStr}</Text>
          <Text style={[styles.timeText, { color: colors.textMuted }]}>{timeStr}</Text>

          <View style={styles.bigMetrics}>
            <View style={styles.bigMetric}>
              <Text style={[styles.bigValue, { color: colors.tint }]}>{formatDistance(run.distance)}</Text>
              <Text style={[styles.bigLabel, { color: colors.textMuted }]}>{t.detail.distanceLabel}</Text>
            </View>
            <View style={styles.bigMetric}>
              <Text style={[styles.bigValue, { color: colors.text }]}>{formatDuration(run.duration)}</Text>
              <Text style={[styles.bigLabel, { color: colors.textMuted }]}>{t.detail.durationLabel}</Text>
            </View>
          </View>

          <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <DetailRow icon="speedometer" label={t.detail.avgSpeed} value={`${avgSpeedKmh.toFixed(1)} km/h`} color={colors.tint} />
            <View style={[styles.sep, { backgroundColor: colors.border }]} />
            <DetailRow icon="timer" label={t.detail.avgPace} value={pace > 0 ? `${Math.floor(pace)}:${Math.round((pace % 1) * 60).toString().padStart(2, "0")} /km` : "--"} color={colors.accentLight} />
            <View style={[styles.sep, { backgroundColor: colors.border }]} />
            <DetailRow icon="flame" label={t.detail.caloriesLabel} value={`${run.calories} kcal`} color={colors.warning} />
            <View style={[styles.sep, { backgroundColor: colors.border }]} />
            <DetailRow icon="flag" label={t.detail.territoriesLabel} value={`${run.territoriesClaimed}`} color={colors.success} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  const colors = Colors.dark;
  return (
    <View style={detailStyles.row}>
      <View style={detailStyles.left}>
        <View style={[detailStyles.iconBg, { backgroundColor: color + "15" }]}>
          <Ionicons name={icon as any} size={18} color={color} />
        </View>
        <Text style={[detailStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[detailStyles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16 },
  left: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBg: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: "Outfit_400Regular", fontSize: 14 },
  value: { fontFamily: "Outfit_600SemiBold", fontSize: 15 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { fontFamily: "Outfit_500Medium", fontSize: 16 },
  backBtn: { padding: 16, alignSelf: "flex-start" },
  backBtnOverlay: { position: "absolute", left: 16, width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  noMap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  noMapText: { fontFamily: "Outfit_400Regular", fontSize: 14 },
  content: { padding: 20 },
  dateText: { fontFamily: "Outfit_600SemiBold", fontSize: 18 },
  timeText: { fontFamily: "Outfit_400Regular", fontSize: 13, marginTop: 2 },
  bigMetrics: { flexDirection: "row", gap: 16, marginTop: 20, marginBottom: 20 },
  bigMetric: { flex: 1 },
  bigValue: { fontFamily: "Outfit_700Bold", fontSize: 32 },
  bigLabel: { fontFamily: "Outfit_400Regular", fontSize: 12, marginTop: 2 },
  detailCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  sep: { height: 1, marginLeft: 60 },
});
