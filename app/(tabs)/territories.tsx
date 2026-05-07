import React, { useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { TerritoryMap } from "@/components/NativeMap";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useData } from "@/contexts/DataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatArea } from "@/lib/territory";
import { Territory } from "@/lib/types";

const isWeb = Platform.OS === "web";

export default function TerritoriesScreen() {
  const insets = useSafeAreaInsets();
  const colors = Colors.dark;
  const { territories } = useData();
  const { t, language } = useLanguage();
  const mapRef = useRef<any>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);

  const totalArea = territories.reduce((sum, t) => sum + t.area, 0);

  const fitAllTerritories = () => {
    if (territories.length === 0) return;
    const allCoords = territories.flatMap((territory) => territory.coordinates);
    if (allCoords.length > 0) {
      mapRef.current?.fitToCoordinates(allCoords, {
        edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
        animated: true,
      });
    }
  };

  const locale = language === "pt" ? "pt-BR" : "en-US";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TerritoryMap
        ref={mapRef}
        territories={territories}
        selectedTerritory={selectedTerritory}
        onSelectTerritory={setSelectedTerritory}
      />

      <View style={[styles.header, { paddingTop: insets.top + (isWeb ? 67 : 8) }]}>
        <View style={[styles.headerCard, { backgroundColor: colors.overlay }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>{t.territories.dominanceMap}</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {territories.length} {territories.length === 1 ? t.territories.territoryClaimed : t.territories.territoriesClaimed}
              </Text>
            </View>
            <View style={styles.headerStats}>
              <Text style={[styles.areaValue, { color: colors.tint }]}>{formatArea(totalArea)}</Text>
              <Text style={[styles.areaLabel, { color: colors.textMuted }]}>{t.territories.totalArea}</Text>
            </View>
          </View>
        </View>
        {territories.length > 0 && !isWeb && (
          <Pressable
            onPress={fitAllTerritories}
            style={({ pressed }) => [styles.fitButton, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name="scan" size={20} color={colors.tint} />
          </Pressable>
        )}
      </View>

      {selectedTerritory && (
        <Animated.View
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(200)}
          style={[styles.territoryDetail, { backgroundColor: colors.surface, borderColor: colors.border, bottom: insets.bottom + (isWeb ? 34 : 0) + 90 }]}
        >
          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: colors.tint + "20" }]}>
              <Ionicons name="flag" size={20} color={colors.tint} />
            </View>
            <View style={styles.detailInfo}>
              <Text style={[styles.detailTitle, { color: colors.text }]}>{t.territories.territory}</Text>
              <Text style={[styles.detailDate, { color: colors.textSecondary }]}>
                {new Date(selectedTerritory.claimedAt).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
              </Text>
            </View>
            <Text style={[styles.detailArea, { color: colors.tint }]}>{formatArea(selectedTerritory.area)}</Text>
          </View>
        </Animated.View>
      )}

      {territories.length === 0 && (
        <View style={styles.emptyOverlay}>
          <View style={[styles.emptyCard, { backgroundColor: colors.overlay }]}>
            <Ionicons name="map-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.territories.noTerritories}</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t.territories.noTerritoriesDesc}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: 16, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  headerCard: { flex: 1, borderRadius: 16, padding: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontFamily: "Outfit_700Bold", fontSize: 20 },
  headerSubtitle: { fontFamily: "Outfit_400Regular", fontSize: 13, marginTop: 2 },
  headerStats: { alignItems: "flex-end" },
  areaValue: { fontFamily: "Outfit_700Bold", fontSize: 18 },
  areaLabel: { fontFamily: "Outfit_400Regular", fontSize: 11, marginTop: 1 },
  fitButton: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, marginTop: 8 },
  territoryDetail: { position: "absolute", left: 16, right: 16, borderRadius: 16, padding: 16, borderWidth: 1 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  detailIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  detailInfo: { flex: 1 },
  detailTitle: { fontFamily: "Outfit_600SemiBold", fontSize: 16 },
  detailDate: { fontFamily: "Outfit_400Regular", fontSize: 12, marginTop: 2 },
  detailArea: { fontFamily: "Outfit_700Bold", fontSize: 18 },
  emptyOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyCard: { borderRadius: 20, padding: 32, alignItems: "center", gap: 12 },
  emptyTitle: { fontFamily: "Outfit_600SemiBold", fontSize: 18 },
  emptyText: { fontFamily: "Outfit_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 },
});
