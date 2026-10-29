import { useEffect, useState } from "react";
import { CloudRain, Wind, Thermometer, Activity } from "lucide-react";
import { timeAgo } from "@/lib/disaster";

type Weather = { temp: number; wind: number; rain: number; code: number; maxTemp: number; maxRain: number; maxWind: number };

export function WeatherWidget({ lat, lng }: { lat: number; lng: number }) {
  const [w, setW] = useState<Weather | null>(null);
  useEffect(() => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,precipitation,weather_code&daily=temperature_2m_max,precipitation_sum,wind_speed_10m_max&forecast_days=1&timezone=auto`;
    fetch(url)
      .then((r) => r.json())
      .then((d) =>
        setW({
          temp: d.current.temperature_2m,
          wind: d.current.wind_speed_10m,
          rain: d.current.precipitation,
          code: d.current.weather_code,
          maxTemp: d.daily.temperature_2m_max[0],
          maxRain: d.daily.precipitation_sum[0],
          maxWind: d.daily.wind_speed_10m_max[0],
        }),
      )
      .catch(() => setW(null));
  }, [lat, lng]);

  const warnings: { label: string; cls: string }[] = [];
  if (w) {
    if (w.maxRain >= 64) warnings.push({ label: "Flood risk – heavy rain", cls: "bg-critical text-critical-foreground" });
    else if (w.maxRain >= 15) warnings.push({ label: "Heavy rain expected", cls: "bg-high text-high-foreground" });
    if (w.maxWind >= 62) warnings.push({ label: "Cyclonic winds", cls: "bg-critical text-critical-foreground" });
    if (w.maxTemp >= 40) warnings.push({ label: "Heatwave conditions", cls: "bg-high text-high-foreground" });
  }

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="text-lg font-bold">Weather now</h2>
      {!w ? (
        <div className="mt-4 h-20 animate-pulse rounded-lg bg-muted" />
      ) : (
        <>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <Stat icon={<Thermometer className="h-5 w-5" />} value={`${Math.round(w.temp)}°`} label={`max ${Math.round(w.maxTemp)}°`} />
            <Stat icon={<CloudRain className="h-5 w-5" />} value={`${w.rain} mm`} label={`${w.maxRain} mm today`} />
            <Stat icon={<Wind className="h-5 w-5" />} value={`${Math.round(w.wind)}`} label="km/h wind" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {warnings.length === 0 ? (
              <span className="rounded-md bg-safe px-2 py-1 text-sm font-semibold text-safe-foreground">No weather warnings</span>
            ) : (
              warnings.map((x) => (
                <span key={x.label} className={`rounded-md px-2 py-1 text-sm font-semibold ${x.cls}`}>{x.label}</span>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <div className="flex justify-center text-muted-foreground">{icon}</div>
      <div className="mt-1 font-display text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

type Quake = { id: string; mag: number; place: string; time: number; url: string };

export function QuakeWidget() {
  const [q, setQ] = useState<Quake[] | null>(null);
  useEffect(() => {
    fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson")
      .then((r) => r.json())
      .then((d) =>
        setQ(
          d.features.slice(0, 6).map((f: { id: string; properties: { mag: number; place: string; time: number; url: string } }) => ({
            id: f.id,
            mag: f.properties.mag,
            place: f.properties.place,
            time: f.properties.time,
            url: f.properties.url,
          })),
        ),
      )
      .catch(() => setQ([]));
  }, []);

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold"><Activity className="h-5 w-5" /> Recent earthquakes</h2>
      <ul className="mt-3 space-y-2">
        {!q
          ? Array.from({ length: 4 }).map((_, i) => <li key={i} className="h-10 animate-pulse rounded-lg bg-muted" />)
          : q.map((e) => (
              <li key={e.id}>
                <a href={e.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted">
                  <span
                    className={`flex h-10 w-12 shrink-0 items-center justify-center rounded-md font-display font-bold ${
                      e.mag >= 6 ? "bg-critical text-critical-foreground" : e.mag >= 4.5 ? "bg-high text-high-foreground" : "bg-moderate text-moderate-foreground"
                    }`}
                  >
                    {e.mag.toFixed(1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{e.place}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(e.time)}</span>
                  </span>
                </a>
              </li>
            ))}
      </ul>
    </section>
  );
}
