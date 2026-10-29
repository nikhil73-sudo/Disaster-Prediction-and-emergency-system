import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Alert = Tables<"alerts">;
export type Shelter = Tables<"shelters">;
export type Incident = Tables<"incidents">;

function beep() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.value = 880;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    o.start();
    o.stop(ctx.currentTime + 0.5);
  } catch {
    /* audio blocked */
  }
}

export function useLiveData() {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [shelters, setShelters] = useState<Shelter[] | null>(null);
  const [incidents, setIncidents] = useState<Incident[] | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      const [a, s, i] = await Promise.all([
        supabase.from("alerts").select("*").eq("active", true).order("created_at", { ascending: false }),
        supabase.from("shelters").select("*"),
        supabase.from("incidents").select("*").order("created_at", { ascending: false }),
      ]);
      if (!mounted.current) return;
      setAlerts(a.data ?? []);
      setShelters(s.data ?? []);
      setIncidents(i.data ?? []);
    })();

    const channel = supabase
      .channel("live-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const row = payload.new as Alert;
          setAlerts((prev) => [row, ...(prev ?? [])]);
          if (row.severity === "critical") {
            beep();
            toast.error(row.title, { description: row.area, duration: 10000 });
          } else {
            toast(row.title, { description: row.area });
          }
        } else if (payload.eventType === "UPDATE") {
          const row = payload.new as Alert;
          setAlerts((prev) =>
            (prev ?? []).map((x) => (x.id === row.id ? row : x)).filter((x) => x.active),
          );
        } else if (payload.eventType === "DELETE") {
          const id = (payload.old as Alert).id;
          setAlerts((prev) => (prev ?? []).filter((x) => x.id !== id));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as Incident).id;
          setIncidents((prev) => (prev ?? []).filter((x) => x.id !== id));
          return;
        }
        const row = payload.new as Incident;
        setIncidents((prev) => [row, ...(prev ?? []).filter((x) => x.id !== row.id)]);
      })
      .subscribe();

    return () => {
      mounted.current = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { alerts, shelters, incidents };
}
