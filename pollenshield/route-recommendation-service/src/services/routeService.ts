import axios from "axios";
import type { RouteRecommendation } from "@pollenshield/shared";
import { allergyRiskServiceUrl, googleMapsApiKey } from "../config/services";

type LatLng = {
  lat: number;
  lng: number;
};

type RouteOptions = {
  travelMode?: "WALK" | "DRIVE" | "BICYCLE" | "TRANSIT";
  useGoogleRoutes?: boolean;
};

type GoogleRoute = {
  duration?: string;
  distanceMeters?: number;
  polyline?: {
    encodedPolyline?: string;
  };
  legs?: Array<{
    steps?: Array<{
      distanceMeters?: number;
      polyline?: {
        encodedPolyline?: string;
      };
    }>;
  }>;
};

const neutralRiskScore = 50;

const clampScore = (score: number): number => Math.min(100, Math.max(0, Math.round(score)));

const parseDurationMinutes = (duration?: string): number => {
  const seconds = Number(duration?.replace("s", "") || 0);
  return Math.max(1, Math.round(seconds / 60));
};

const getLocationRisk = async (locationId: string): Promise<number | null> => {
  try {
    const response = await axios.get(`${allergyRiskServiceUrl}/api/risk/location/${locationId}`, { timeout: 3000 });
    const riskData = response.data?.data || response.data;
    return typeof riskData.score === "number" ? riskData.score : null;
  } catch (error) {
    console.error(`Risk lookup failed for ${locationId}`, error);
    return null;
  }
};

const getPollenRisk = async (point: LatLng): Promise<number | null> => {
  if (!googleMapsApiKey) {
    return null;
  }

  try {
    const response = await axios.get("https://pollen.googleapis.com/v1/forecast:lookup", {
      timeout: 4000,
      params: {
        key: googleMapsApiKey,
        "location.latitude": point.lat,
        "location.longitude": point.lng,
        days: 1,
        pageSize: 1,
        plantsDescription: false
      }
    });

    const pollenTypes = response.data?.dailyInfo?.[0]?.pollenTypeInfo;
    if (!Array.isArray(pollenTypes)) {
      return null;
    }

    const values = pollenTypes
      .map((typeInfo) => typeInfo?.indexInfo?.value)
      .filter((value): value is number => typeof value === "number");

    if (!values.length) {
      return null;
    }

    return clampScore(Math.max(...values) * 20);
  } catch (error) {
    console.error(`Pollen lookup failed for ${point.lat},${point.lng}`, error);
    return null;
  }
};

const buildCandidateRoutes = (candidateLocationIds: string[]): string[][] => {
  const candidates = candidateLocationIds.length > 0 ? candidateLocationIds : ["default-location"];
  return [
    candidates,
    [...candidates].reverse(),
    candidates.length > 1 ? [candidates[0], candidates[candidates.length - 1]] : candidates
  ];
};

const decodePolyline = (encoded: string): LatLng[] => {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: LatLng[] = [];

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coordinates.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return coordinates;
};

const toRadians = (value: number): number => (value * Math.PI) / 180;

const distanceBetween = (a: LatLng, b: LatLng): number => {
  const earthRadiusMeters = 6371000;
  const deltaLat = toRadians(b.lat - a.lat);
  const deltaLng = toRadians(b.lng - a.lng);
  const startLat = toRadians(a.lat);
  const endLat = toRadians(b.lat);
  const h =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const locationIdForPoint = (point: LatLng): string => `geo:${point.lat.toFixed(2)}:${point.lng.toFixed(2)}`;

const sampleRoutePoints = (points: LatLng[], maxSamples = 12): LatLng[] => {
  if (points.length <= maxSamples) {
    return points;
  }

  return Array.from({ length: maxSamples }, (_, index) => {
    const pointIndex = Math.round((index * (points.length - 1)) / (maxSamples - 1));
    return points[pointIndex];
  });
};

const scorePoint = async (point: LatLng): Promise<number> => {
  const locationId = locationIdForPoint(point);
  const pollenRisk = await getPollenRisk(point);
  if (pollenRisk !== null) {
    return pollenRisk;
  }

  const cachedRisk = await getLocationRisk(locationId);
  return cachedRisk ?? neutralRiskScore;
};

const scoreGoogleRoute = async (
  googleRoute: GoogleRoute,
  index: number,
  startLocation: string,
  destinationLocation: string
): Promise<RouteRecommendation> => {
  const encodedPolyline = googleRoute.polyline?.encodedPolyline || "";
  const decodedPoints = encodedPolyline ? decodePolyline(encodedPolyline) : [];
  const sampledPoints = sampleRoutePoints(decodedPoints);
  const fallbackDistance = googleRoute.distanceMeters || 0;

  const riskScores = await Promise.all(sampledPoints.map(scorePoint));
  const segments = sampledPoints.map((point, segmentIndex) => {
    const nextPoint = sampledPoints[segmentIndex + 1] || sampledPoints[segmentIndex];
    const segmentDistance = segmentIndex === sampledPoints.length - 1 ? 0 : distanceBetween(point, nextPoint);

    return {
      locationId: locationIdForPoint(point),
      riskScore: riskScores[segmentIndex] ?? neutralRiskScore,
      lat: point.lat,
      lng: point.lng,
      distanceMeters: Math.round(segmentDistance)
    };
  });

  const totalSegmentDistance = segments.reduce((sum, segment) => sum + (segment.distanceMeters || 0), 0);
  const weightFallback = segments.length ? fallbackDistance / segments.length : fallbackDistance;
  const weightedRiskTotal = segments.reduce((sum, segment) => {
    const weight = segment.distanceMeters && segment.distanceMeters > 0 ? segment.distanceMeters : weightFallback || 1;
    return sum + segment.riskScore * weight;
  }, 0);
  const weightTotal = totalSegmentDistance || weightFallback * Math.max(segments.length, 1) || 1;
  const averageRiskScore = clampScore(weightedRiskTotal / weightTotal);

  return {
    routeId: `google-route-${index + 1}`,
    startLocation,
    destinationLocation,
    totalRiskScore: averageRiskScore,
    averageRiskScore,
    estimatedDurationMinutes: parseDurationMinutes(googleRoute.duration),
    distanceMeters: fallbackDistance,
    encodedPolyline,
    source: "google",
    segments
  };
};

const fetchGoogleRoutes = async (
  startLocation: string,
  destinationLocation: string,
  travelMode: RouteOptions["travelMode"]
): Promise<GoogleRoute[]> => {
  const response = await axios.post(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      origin: { address: startLocation },
      destination: { address: destinationLocation },
      travelMode: travelMode || "WALK",
      computeAlternativeRoutes: true,
      polylineQuality: "OVERVIEW",
      polylineEncoding: "ENCODED_POLYLINE"
    },
    {
      timeout: 7000,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": googleMapsApiKey,
        "X-Goog-FieldMask":
          "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps.distanceMeters,routes.legs.steps.polyline.encodedPolyline"
      }
    }
  );

  return Array.isArray(response.data?.routes) ? response.data.routes : [];
};

const sortRoutes = (routes: RouteRecommendation[]): RouteRecommendation[] =>
  [...routes].sort((a, b) => {
    const riskDelta = a.averageRiskScore - b.averageRiskScore;
    if (Math.abs(riskDelta) <= 5) {
      return a.estimatedDurationMinutes - b.estimatedDurationMinutes;
    }
    return riskDelta;
  });

const recommendMockRoute = async (
  startLocation: string,
  destinationLocation: string,
  candidateLocationIds: string[]
): Promise<{ recommendedRoute: RouteRecommendation; alternatives: RouteRecommendation[] }> => {
  const routeCandidates = buildCandidateRoutes(candidateLocationIds);

  const alternatives = await Promise.all(
    routeCandidates.map(async (locations, index): Promise<RouteRecommendation> => {
      const riskScores = await Promise.all(
        locations.map(async (locationId) => {
          const riskScore = await getLocationRisk(locationId);
          return riskScore ?? neutralRiskScore;
        })
      );
      const segments = locations.map((locationId, segmentIndex) => ({
        locationId,
        riskScore: riskScores[segmentIndex],
        distanceMeters: 1000
      }));
      const averageRiskScore = clampScore(riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length);

      return {
        routeId: `mock-route-${index + 1}`,
        startLocation,
        destinationLocation,
        totalRiskScore: averageRiskScore,
        averageRiskScore,
        estimatedDurationMinutes: 15 + index * 5,
        distanceMeters: segments.length * 1000,
        source: "mock",
        segments
      };
    })
  );

  const recommendedRoute = sortRoutes(alternatives)[0];
  return { recommendedRoute, alternatives };
};

export const recommendSafestRoute = async (
  startLocation: string,
  destinationLocation: string,
  candidateLocationIds: string[],
  options: RouteOptions = {}
): Promise<{ recommendedRoute: RouteRecommendation; alternatives: RouteRecommendation[] }> => {
  if (options.useGoogleRoutes && googleMapsApiKey) {
    try {
      const googleRoutes = await fetchGoogleRoutes(startLocation, destinationLocation, options.travelMode || "WALK");
      if (googleRoutes.length) {
        const alternatives = await Promise.all(
          googleRoutes.map((route, index) => scoreGoogleRoute(route, index, startLocation, destinationLocation))
        );
        const recommendedRoute = sortRoutes(alternatives)[0];
        return { recommendedRoute, alternatives };
      }
    } catch (error) {
      console.error("Google route lookup failed, falling back to mock routes", error);
    }
  }

  return recommendMockRoute(startLocation, destinationLocation, candidateLocationIds);
};
