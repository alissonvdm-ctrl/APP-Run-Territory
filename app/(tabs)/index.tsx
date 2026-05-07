import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { RunMap } from "@/components/NativeMap";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useData } from "@/contexts/DataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Coordinate,
  RunState,
  MAX_RUNNING_SPEED,
  GPS_UPDATE_INTERVAL,
  GPS_MIN_DISTANCE,
} from "@/lib/types";
import {
  formatDistance,
  formatDuration,
  formatPace,
  estimateCalories,
  detectClosedLoops,
  createTerritory,
  haversineDistance,
} from "@/lib/territory";
import * as Crypto from "expo-crypto";

const isWeb = Platform.OS === "web";

export default function RunScreen() {
  const insets = useSafeAreaInsets();
  const colors = Colors.dark;
  const { territories, addRun } = useData();
  const { t } = useLanguage();

  const [permissionStatus, setPermissionStatus] = useState<string | null>(isWeb ? "granted" : null);
  const [runState, setRunState] = useState<RunState>("idle");
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [calories, setCalories] = useState(0);
  const [isVehicleDetected, setIsVehicleDetected] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [newTerritories, setNewTerritories] = useState<
    { latitude: number; longitude: number }[][]
  >([]);

  const mapRef = useRef<any>(null);
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const pauseStartRef = useRef<number>(0);
  const coordinatesRef = useRef<Coordinate[]>([]);
  const runIdRef = useRef<string>("");

  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    if (runState === "running") {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseAnim.value = withTiming(1, { duration: 300 });
    }
  }, [runState]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  useEffect(() => {
    if (!isWeb) requestPermission();
    return () => {
      locationSub.current?.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(status);
    if (status === "granted") {
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch {}
    }
  };

  const startRun = useCallback(async () => {
    if (!isWeb) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    runIdRef.current = Crypto.randomUUID();
    startTimeRef.current = Date.now();
    pausedDurationRef.current = 0;
    coordinatesRef.current = [];
    setCoordinates([]);
    setDistance(0);
    setDuration(0);
    setCalories(0);
    setCurrentSpeed(0);
    setNewTerritories([]);
    setRunState("running");

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000;
      setDuration(elapsed);
    }, 1000);

    if (!isWeb) {
      locationSub.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: GPS_UPDATE_INTERVAL,
          distanceInterval: GPS_MIN_DISTANCE,
        },
        (loc) => handleNewLocation(loc)
      );
    }
  }, [territories]);

  const handleNewLocation = useCallback(
    (loc: Location.LocationObject) => {
      const speed = loc.coords.speed ?? 0;
      const absSpeed = Math.abs(speed);

      if (absSpeed > MAX_RUNNING_SPEED) {
        setIsVehicleDetected(true);
        return;
      }
      setIsVehicleDetected(false);

      const newCoord: Coordinate = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        timestamp: loc.timestamp,
        speed: absSpeed,
        altitude: loc.coords.altitude,
      };

      setCurrentSpeed(absSpeed);
      setCurrentLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });

      const prev = coordinatesRef.current;
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        const segDist = haversineDistance(last.latitude, last.longitude, newCoord.latitude, newCoord.longitude);
        setDistance((d) => d + segDist);
      }

      coordinatesRef.current = [...prev, newCoord];
      setCoordinates([...coordinatesRef.current]);

      const elapsed = (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000;
      const totalDist = coordinatesRef.current.reduce((sum, c, i) => {
        if (i === 0) return 0;
        const p = coordinatesRef.current[i - 1];
        return sum + haversineDistance(p.latitude, p.longitude, c.latitude, c.longitude);
      }, 0);
      setCalories(estimateCalories(totalDist, elapsed));

      const loops = detectClosedLoops(coordinatesRef.current, territories);
      if (loops.length > 0) {
        const newTs = loops.map((l) => l.loopCoords);
        setNewTerritories((prev) => [...prev, ...newTs]);
        if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      mapRef.current?.animateToRegion(
        { latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 },
        500
      );
    },
    [territories]
  );

  const pauseRun = useCallback(async () => {
    if (!isWeb) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRunState("paused");
    pauseStartRef.current = Date.now();
    locationSub.current?.remove();
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const resumeRun = useCallback(async () => {
    if (!isWeb) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    pausedDurationRef.current += Date.now() - pauseStartRef.current;
    setRunState("running");
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000;
      setDuration(elapsed);
    }, 1000);
    if (!isWeb) {
      locationSub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: GPS_UPDATE_INTERVAL, distanceInterval: GPS_MIN_DISTANCE },
        (loc) => handleNewLocation(loc)
      );
    }
  }, [handleNewLocation]);

  const stopRun = useCallback(async () => {
    if (!isWeb) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    locationSub.current?.remove();
    if (timerRef.current) clearInterval(timerRef.current);

    const savedTerritories = [];
    for (const tc of newTerritories) {
      const territory = createTerritory(tc, runIdRef.current);
      savedTerritories.push(territory);
    }

    const totalDist = coordinatesRef.current.reduce((sum, c, i) => {
      if (i === 0) return 0;
      const p = coordinatesRef.current[i - 1];
      return sum + haversineDistance(p.latitude, p.longitude, c.latitude, c.longitude);
    }, 0);

    const speeds = coordinatesRef.current.map((c) => c.speed ?? 0).filter((s) => s > 0);
    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

    const run = {
      id: runIdRef.current,
      startTime: startTimeRef.current,
      endTime: Date.now(),
      distance: totalDist,
      duration,
      avgSpeed,
      calories,
      territoriesClaimed: savedTerritories.length,
      coordinates: coordinatesRef.current,
    };

    await addRun(run, savedTerritories);
    setRunState("idle");
    setCoordinates([]);
    setNewTerritories([]);
    setDistance(0);
    setDuration(0);
    setCalories(0);
    setCurrentSpeed(0);
  }, [duration, calories, newTerritories, addRun]);

  const confirmStop = useCallback(() => {
    if (isWeb) { stopRun(); return; }
    Alert.alert(t.run.endRun, t.run.endRunConfirm, [
      { text: t.run.cancel, style: "cancel" },
      { text: t.run.endRun, style: "destructive", onPress: stopRun },
    ]);
  }, [stopRun, t]);

  if (permissionStatus === null) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (permissionStatus !== "granted" && !isWeb) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <Ionicons name="location-outline" size={64} color={colors.textMuted} />
        <Text style={[styles.permTitle, { color: colors.text }]}>{t.run.locationRequired}</Text>
        <Text style={[styles.permText, { color: colors.textSecondary }]}>
          {t.run.locationDescription}
        </Text>
        <Pressable onPress={requestPermission} style={({ pressed }) => [styles.permButton, { backgroundColor: colors.tint, opacity: pressed ? 0.8 : 1 }]}>
          <Text style={styles.permButtonText}>{t.run.grantAccess}</Text>
        </Pressable>
      </View>
    );
  }

  const routeCoords = coordinates.map((c) => ({ latitude: c.latitude, longitude: c.longitude }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <RunMap
        ref={mapRef}
        currentLocation={currentLocation}
        routeCoords={routeCoords}
        territories={territories}
        newTerritories={newTerritories}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + (isWeb ? 67 : 8) }]}>
        {isVehicleDetected && runState === "running" && (
          <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={[styles.vehicleWarning, { backgroundColor: colors.warning }]}>
            <Ionicons name="car" size={16} color="#000" />
            <Text style={styles.vehicleText}>{t.run.vehicleDetected}</Text>
          </Animated.View>
        )}
      </View>

      {runState !== "idle" && (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[styles.metricsPanel, { backgroundColor: colors.overlay, paddingTop: insets.top + (isWeb ? 67 : 0) + 12 }]}
        >
          <View style={styles.metricsRow}>
            <MetricItem label={t.run.distance} value={formatDistance(distance)} color={colors.tint} />
            <MetricItem label={t.run.time} value={formatDuration(duration)} color={colors.text} large />
            <MetricItem label={t.run.pace} value={formatPace(currentSpeed)} suffix={t.run.perKm} color={colors.accentLight} />
          </View>
          <View style={styles.metricsRow}>
            <MetricItem label={t.run.speed} value={`${(currentSpeed * 3.6).toFixed(1)}`} suffix={t.run.kmh} color={colors.textSecondary} />
            <MetricItem label={t.run.calories} value={`${calories}`} suffix={t.run.kcal} color={colors.warning} />
            <MetricItem label={t.run.claimed} value={`${newTerritories.length}`} color={colors.success} />
          </View>
        </Animated.View>
      )}

      <View style={[styles.controlBar, { paddingBottom: insets.bottom + (isWeb ? 34 : 0) + 80 }]}>
        {runState === "idle" && (
          <Pressable onPress={startRun} style={({ pressed }) => [styles.startButton, { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 }]}>
            <Animated.View style={pulseStyle}>
              <Ionicons name="play" size={32} color="#0A1628" />
            </Animated.View>
          </Pressable>
        )}
        {runState === "running" && (
          <View style={styles.runControls}>
            <Pressable onPress={confirmStop} style={({ pressed }) => [styles.stopButton, { backgroundColor: colors.danger, opacity: pressed ? 0.85 : 1 }]}>
              <Ionicons name="stop" size={24} color="#fff" />
            </Pressable>
            <Pressable onPress={pauseRun} style={({ pressed }) => [styles.pauseButton, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}>
              <Ionicons name="pause" size={24} color={colors.text} />
            </Pressable>
          </View>
        )}
        {runState === "paused" && (
          <View style={styles.runControls}>
            <Pressable onPress={confirmStop} style={({ pressed }) => [styles.stopButton, { backgroundColor: colors.danger, opacity: pressed ? 0.85 : 1 }]}>
              <Ionicons name="stop" size={24} color="#fff" />
            </Pressable>
            <Pressable onPress={resumeRun} style={({ pressed }) => [styles.startButton, { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 }]}>
              <Ionicons name="play" size={28} color="#0A1628" />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

function MetricItem({ label, value, suffix, color, large }: { label: string; value: string; suffix?: string; color: string; large?: boolean }) {
  const colors = Colors.dark;
  return (
    <View style={styles.metricItem}>
      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{label}</Text>
      <View style={styles.metricValueRow}>
        <Text style={[large ? styles.metricValueLarge : styles.metricValue, { color }]}>{value}</Text>
        {suffix && <Text style={[styles.metricSuffix, { color: colors.textMuted }]}>{suffix}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: 16 },
  vehicleWarning: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, gap: 8, alignSelf: "center" },
  vehicleText: { fontFamily: "Outfit_500Medium", fontSize: 13, color: "#000" },
  metricsPanel: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 12, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  metricsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  metricItem: { flex: 1, alignItems: "center" },
  metricLabel: { fontFamily: "Outfit_500Medium", fontSize: 10, letterSpacing: 1.5, marginBottom: 2 },
  metricValueRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  metricValue: { fontFamily: "Outfit_700Bold", fontSize: 22 },
  metricValueLarge: { fontFamily: "Outfit_700Bold", fontSize: 28 },
  metricSuffix: { fontFamily: "Outfit_400Regular", fontSize: 11 },
  controlBar: { position: "absolute", bottom: 0, left: 0, right: 0, alignItems: "center", paddingTop: 16 },
  startButton: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", shadowColor: "#00D4AA", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  runControls: { flexDirection: "row", alignItems: "center", gap: 24 },
  stopButton: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  pauseButton: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  permTitle: { fontFamily: "Outfit_700Bold", fontSize: 24, marginTop: 20, textAlign: "center" },
  permText: { fontFamily: "Outfit_400Regular", fontSize: 15, textAlign: "center", paddingHorizontal: 40, marginTop: 8, lineHeight: 22 },
  permButton: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 28, marginTop: 24 },
  permButtonText: { fontFamily: "Outfit_600SemiBold", fontSize: 16, color: "#0A1628" },
});
