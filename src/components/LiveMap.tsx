import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import type { Alert, Incident, Shelter } from "@/hooks/use-live-data";
import type { Severity } from "@/lib/disaster";
import { severityLabel, severityVar } from "@/lib/disaster";

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

const kindColor: Record<string, string> = {
  shelter: "var(--safe)",
  hospital: "oklch(0.55 0.15 240)",
  relief_camp: "oklch(0.5 0.12 300)",
};

export default function LiveMap({
  center,
  alerts,
  shelters,
  incidents,
}: {
  center: { lat: number; lng: number };
  alerts: Alert[];
  shelters: Shelter[];
  incidents: Incident[];
}) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={11} className="h-full w-full" scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={center.lat} lng={center.lng} />
      <CircleMarker center={[center.lat, center.lng]} radius={9} pathOptions={{ color: "white", weight: 3, fillColor: "oklch(0.55 0.18 250)", fillOpacity: 1 }}>
        <Popup>You are here</Popup>
      </CircleMarker>
      {alerts.filter((a) => a.lat != null && a.lng != null).map((a) => (
        <Circle
          key={a.id}
          center={[a.lat!, a.lng!]}
          radius={(a.radius_km ?? 10) * 1000}
          pathOptions={{ color: severityVar[a.severity as Severity], fillOpacity: 0.15, weight: 2 }}
        >
          <Popup>
            <strong>{a.title}</strong>
            <br />
            {severityLabel[a.severity as Severity]} · {a.area}
          </Popup>
        </Circle>
      ))}
      {incidents.map((i) => (
        <CircleMarker
          key={i.id}
          center={[i.lat, i.lng]}
          radius={8}
          pathOptions={{ color: "black", weight: 1, fillColor: severityVar[i.severity as Severity], fillOpacity: 0.95 }}
        >
          <Popup>
            <strong>{i.type.replace("_", " ")}</strong> — {i.status.replace("_", " ")}
            <br />
            {i.description}
          </Popup>
        </CircleMarker>
      ))}
      {shelters.map((s) => (
        <CircleMarker
          key={s.id}
          center={[s.lat, s.lng]}
          radius={7}
          pathOptions={{ color: "white", weight: 2, fillColor: kindColor[s.kind] ?? "gray", fillOpacity: 1 }}
        >
          <Popup>
            <strong>{s.name}</strong>
            <br />
            {s.kind.replace("_", " ")} · {s.occupancy}/{s.capacity}
            {s.contact ? <><br />📞 {s.contact}</> : null}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
