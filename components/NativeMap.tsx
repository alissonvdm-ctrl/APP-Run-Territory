import React, { forwardRef } from "react";
import { StyleSheet, View } from "react-native";
import MapViewRN, { Polyline, Polygon, Marker, PROVIDER_DEFAULT } from "react-native-maps";
import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { Territory } from "@/lib/types";

interface RunMapProps {
  currentLocation: { latitude: number; longitude: number } | null;
  routeCoords: { latitude: number; longitude: number }[];
  territories: Territory[];
  newTerritories: { latitude: number; longitude: number }[][];
}

export const RunMap = forwardRef<MapViewRN, RunMapProps>(
  ({ currentLocation, routeCoords, territories, newTerritories }, ref) => {
    const colors = Colors.dark;
    return (
      <MapViewRN
        ref={ref}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        mapType="standard"
        customMapStyle={darkMapStyle}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        initialRegion={
          currentLocation
            ? {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.008,
                longitudeDelta: 0.008,
              }
            : {
                latitude: 37.7749,
                longitude: -122.4194,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
        }
      >
        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={colors.tint}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}
        {territories.map((t) => (
          <Polygon
            key={t.id}
            coordinates={t.coordinates}
            fillColor={t.color}
            strokeColor={colors.territory.mineBorder}
            strokeWidth={2}
          />
        ))}
        {newTerritories.map((tc, i) => (
          <Polygon
            key={`new-${i}`}
            coordinates={tc}
            fillColor="rgba(0, 212, 170, 0.4)"
            strokeColor={colors.tint}
            strokeWidth={3}
          />
        ))}
      </MapViewRN>
    );
  }
);

interface TerritoryMapProps {
  territories: Territory[];
  selectedTerritory: Territory | null;
  onSelectTerritory: (t: Territory | null) => void;
}

export const TerritoryMap = forwardRef<MapViewRN, TerritoryMapProps>(
  ({ territories, selectedTerritory, onSelectTerritory }, ref) => {
    const colors = Colors.dark;
    return (
      <MapViewRN
        ref={ref}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        mapType="standard"
        customMapStyle={darkMapStyle}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        onPress={() => onSelectTerritory(null)}
        initialRegion={{
          latitude:
            territories.length > 0 ? territories[0].centerLat : 37.7749,
          longitude:
            territories.length > 0 ? territories[0].centerLng : -122.4194,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        {territories.map((t) => (
          <React.Fragment key={t.id}>
            <Polygon
              coordinates={t.coordinates}
              fillColor={
                selectedTerritory?.id === t.id
                  ? "rgba(0, 212, 170, 0.5)"
                  : t.color
              }
              strokeColor={
                selectedTerritory?.id === t.id
                  ? colors.tintLight
                  : colors.territory.mineBorder
              }
              strokeWidth={selectedTerritory?.id === t.id ? 3 : 2}
              tappable
              onPress={() => onSelectTerritory(t)}
            />
            <Marker
              coordinate={{
                latitude: t.centerLat,
                longitude: t.centerLng,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => onSelectTerritory(t)}
            >
              <View style={markerStyles.marker}>
                <Ionicons name="flag" size={14} color={colors.tint} />
              </View>
            </Marker>
          </React.Fragment>
        ))}
      </MapViewRN>
    );
  }
);

interface DetailMapProps {
  routeCoords: { latitude: number; longitude: number }[];
}

export const DetailMap = ({ routeCoords }: DetailMapProps) => {
  const colors = Colors.dark;
  if (routeCoords.length < 2) return null;
  return (
    <MapViewRN
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_DEFAULT}
      customMapStyle={darkMapStyle}
      scrollEnabled={false}
      zoomEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      initialRegion={{
        latitude: routeCoords[0].latitude,
        longitude: routeCoords[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      <Polyline
        coordinates={routeCoords}
        strokeColor={colors.tint}
        strokeWidth={3}
        lineCap="round"
      />
    </MapViewRN>
  );
};

const markerStyles = StyleSheet.create({
  marker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(10, 22, 40, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 170, 0.3)",
  },
});

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#0d1b2a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5a6f94" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0d1b2a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a2742" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1e2d4a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a1628" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#131e33" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0f2318" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#1e2d4a" }] },
];
