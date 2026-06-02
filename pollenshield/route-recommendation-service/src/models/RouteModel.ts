export interface RouteRequest {
  startLocation: string;
  destinationLocation: string;
  candidateLocationIds?: string[];
  travelMode?: "WALK" | "DRIVE" | "BICYCLE" | "TRANSIT";
  useGoogleRoutes?: boolean;
}
