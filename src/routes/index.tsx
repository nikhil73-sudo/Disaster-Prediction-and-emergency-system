import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useMemo } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { ShieldCheck, ShieldX, Navigation, Phone, Siren } from "lucide-react";
import { useLiveData } from "@/hooks/use-live-data";
import { useLocation } from "@/hooks/use-location";
import { WeatherWidget, QuakeWidget } from "@/components/Widgets";
import {
  distanceKm,
  EMERGENCY_NUMBERS,
  severityClass,
  severityLabel,
  timeAgo,
  type Severity,
} from "@/lib/disaster";

const LiveMap = lazy(() => import("@/components/LiveMap"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Live Disaster Awareness — SurakshaNet" },
      { name: "description", content: "Live map of disasters, alerts, shelters and hospitals near you, with one-tap SOS." },
      { property: "og:title", content: "Live Disaster Awareness — SurakshaNet" },
      { property: "og:description", content: "Real-time alerts, weather warnings, earthquakes and nearest shelters around you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { loc, status } = useLocation();
  const { alerts, shelters, incidents } = useLiveData();

  const danger = useMemo(
    () =>
      (alerts ?? []).find(
        (a) =>
          (a.severity === "critical" || a.severity === "high") &&
          a.lat != null &&
          a.lng != null &&
          distanceKm(loc, { lat: a.lat, lng: a.lng }) <= (a.radius_km ?? 10),
      ),
    [alerts, loc],
  );

  const nearby = useMemo(
    () =>
      (shelters ?? [])
        .map((s) => ({ ...s, d: distanceKm(loc, s) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 5),
    [shelters, loc],
  );

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-5">
      {/* Status banner */}
      {alerts === null ? (
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      ) : danger ? (
        <div className="flex items-center gap-4 rounded-xl bg-critical p-5 text-critical-foreground">
          <ShieldX className="h-12 w-12 shrink-0" />
          <div>
            <p className="font-display text-2xl font-extrabold">NOT SAFE — you are in an alert zone</p>
            <p className="text-base opacity-95">{danger.title}. {danger.instructions}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 rounded-xl bg-safe p-5 text-safe-foreground">
          <ShieldCheck className="h-12 w-12 shrink-0" />
          <div>
            <p className="font-display text-2xl font-extrabold">SAFE — no active danger near you</p>
            <p className="text-base opacity-95">
              {status === "granted" ? "Based on your current location." : "Using default location (Hyderabad). Allow location for accuracy."}
            </p>
          </div>
        </div>
      )}

      {/* SOS + quick dial */}
      <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
        <Link
          to="/sos"
          className="animate-sos flex items-center justify-center gap-3 rounded-xl bg-critical px-8 py-5 font-display text-2xl font-extrabold text-critical-foreground"
        >
          <Siren className="h-8 w-8" /> SEND SOS
        </Link>
        <div className="grid grid-cols-4 gap-2">
          {EMERGENCY_NUMBERS.map((n) => (
            <a key={n.num} href={`tel:${n.num}`} className="flex flex-col items-center justify-center rounded-xl border-2 bg-card py-3 hover:border-foreground">
              <span className="flex items-center gap-1 font-display text-xl font-extrabold"><Phone className="h-4 w-4" />{n.num}</span>
              <span className="text-xs font-medium text-muted-foreground">{n.label}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {/* Map */}
        <section className="overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-lg font-bold">Live map</h2>
            <div className="flex flex-wrap gap-3 text-xs font-medium text-muted-foreground">
              <Legend cls="bg-critical" label="Danger zone" />
              <Legend cls="bg-safe" label="Shelter" />
              <Legend cls="bg-chart-5" label="Hospital" />
            </div>
          </div>
          <div className="h-[420px]">
            <ClientOnly fallback={<div className="h-full animate-pulse bg-muted" />}>
              <Suspense fallback={<div className="h-full animate-pulse bg-muted" />}>
                <LiveMap center={loc} alerts={alerts ?? []} shelters={shelters ?? []} incidents={incidents ?? []} />
              </Suspense>
            </ClientOnly>
          </div>
        </section>

        {/* Alert feed */}
        <section className="rounded-xl border bg-card p-4">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <span className="animate-live h-2.5 w-2.5 rounded-full bg-critical" /> Live alerts
          </h2>
          <ul className="mt-3 max-h-[440px] space-y-3 overflow-y-auto pr-1">
            {alerts === null
              ? Array.from({ length: 3 }).map((_, i) => <li key={i} className="h-24 animate-pulse rounded-lg bg-muted" />)
              : alerts.length === 0
                ? <li className="text-muted-foreground">No active alerts.</li>
                : alerts.map((a) => (
                    <li key={a.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${severityClass[a.severity as Severity]}`}>
                          {severityLabel[a.severity as Severity]}
                        </span>
                        <span className="text-xs text-muted-foreground">{timeAgo(a.created_at)}</span>
                      </div>
                      <p className="mt-2 font-semibold leading-snug">{a.title}</p>
                      <p className="text-sm text-muted-foreground">{a.area}</p>
                      {a.instructions && <p className="mt-1 text-sm">{a.instructions}</p>}
                    </li>
                  ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <WeatherWidget lat={loc.lat} lng={loc.lng} />
        <QuakeWidget />
        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-lg font-bold">Nearest help</h2>
          <ul className="mt-3 space-y-2">
            {shelters === null
              ? Array.from({ length: 4 }).map((_, i) => <li key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)
              : nearby.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.kind.replace("_", " ")} · {s.d.toFixed(1)} km · {s.capacity - s.occupancy} spaces free
                      </p>
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Directions to ${s.name}`}
                      className="rounded-lg bg-primary p-2 text-primary-foreground"
                    >
                      <Navigation className="h-4 w-4" />
                    </a>
                  </li>
                ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`h-2.5 w-2.5 rounded-full ${cls}`} /> {label}
    </span>
  );
}
