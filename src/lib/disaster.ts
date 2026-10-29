export type Severity = "critical" | "high" | "moderate" | "safe";

export const severityLabel: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  moderate: "Moderate",
  safe: "Safe",
};

export const severityClass: Record<Severity, string> = {
  critical: "bg-critical text-critical-foreground",
  high: "bg-high text-high-foreground",
  moderate: "bg-moderate text-moderate-foreground",
  safe: "bg-safe text-safe-foreground",
};

export const severityVar: Record<Severity, string> = {
  critical: "var(--critical)",
  high: "var(--high)",
  moderate: "var(--moderate)",
  safe: "var(--safe)",
};

export const DEFAULT_LOCATION = { lat: 17.385, lng: 78.4867 }; // Hyderabad

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function timeAgo(iso: string | number) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

export const EMERGENCY_NUMBERS = [
  { num: "112", label: "Emergency" },
  { num: "108", label: "Ambulance" },
  { num: "101", label: "Fire" },
  { num: "100", label: "Police" },
];
