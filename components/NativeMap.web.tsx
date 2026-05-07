import React, { forwardRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { Territory } from "@/lib/types";

function WebFallback({ message }: { message?: string }) {
  const colors = Colors.dark;
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Ionicons name="map-outline" size={56} color={colors.textMuted} />
      <Text style={[styles.title, { color: colors.text }]}>Map View</Text>
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        {message || "Open this app on your phone to see the interactive map"}
      </Text>
    </View>
  );
}

interface RunMapProps {
  currentLocation: { latitude: number; longitude: number } | null;
  routeCoords: { latitude: number; longitude: number }[];
  territories: Territory[];
  newTerritories: { latitude: number; longitude: number }[][];
}

export const RunMap = forwardRef<any, RunMapProps>((props, ref) => {
  return (
    <WebFallback message="Open on your phone with Expo Go to use GPS tracking and see your route on the map" />
  );
});

interface TerritoryMapProps {
  territories: Territory[];
  selectedTerritory: Territory | null;
  onSelectTerritory: (t: Territory | null) => void;
}

export const TerritoryMap = forwardRef<any, TerritoryMapProps>((props, ref) => {
  return (
    <WebFallback message="Open on your phone to see your claimed territories on the map" />
  );
});

interface DetailMapProps {
  routeCoords: { latitude: number; longitude: number }[];
}

export const DetailMap = ({ routeCoords }: DetailMapProps) => {
  return (
    <WebFallback message="Map view available on mobile" />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 40,
    borderRadius: 16,
  },
  title: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 18,
  },
  text: {
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
