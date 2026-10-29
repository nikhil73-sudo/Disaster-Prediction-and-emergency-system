import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, MapPin, Phone, Siren } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "@/hooks/use-location";
import { EMERGENCY_NUMBERS } from "@/lib/disaster";

export const Route = createFileRoute("/sos")({
  head: () => ({
    meta: [
      { title: "Send SOS — SurakshaNet" },
      { name: "description", content: "Send your GPS location and a message to authorities, or call 112, 108, 101 or 100 in one tap." },
      { property: "og:title", content: "Send SOS — SurakshaNet" },
      { property: "og:description", content: "Emergency SOS with live GPS location and one-tap emergency calls." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SosPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  phone: z.string().trim().max(20).optional(),
  message: z.string().trim().max(500).optional(),
});

function SosPage() {
  const { loc, status } = useLocation();
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setError(null);
    setState("sending");
    const { error } = await supabase.from("sos_requests").insert({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      message: parsed.data.message || null,
      lat: status === "granted" ? loc.lat : null,
      lng: status === "granted" ? loc.lng : null,
    });
    if (error) {
      setState("idle");
      setError("Could not send. Please call 112 directly.");
      return;
    }
    setState("sent");
  }

  const shareText = encodeURIComponent(
    `SOS! I need help. ${form.message} My location: https://maps.google.com/?q=${loc.lat},${loc.lng}`,
  );

  return (
    <main className="mx-auto max-w-xl space-y-5 px-4 py-6">
      <div className="grid grid-cols-2 gap-3">
        {EMERGENCY_NUMBERS.map((n, i) => (
          <a
            key={n.num}
            href={`tel:${n.num}`}
            className={`flex items-center justify-center gap-3 rounded-xl py-5 font-display text-2xl font-extrabold ${
              i === 0 ? "col-span-2 bg-critical text-critical-foreground" : "border-2 bg-card"
            }`}
          >
            <Phone className="h-6 w-6" /> {n.num}
            <span className="text-base font-semibold opacity-80">{n.label}</span>
          </a>
        ))}
      </div>

      {state === "sent" ? (
        <section className="rounded-xl bg-safe p-6 text-center text-safe-foreground">
          <CheckCircle2 className="mx-auto h-14 w-14" />
          <h1 className="mt-3 text-2xl font-extrabold">SOS sent to authorities</h1>
          <p className="mt-2">Stay where you are if it is safe. Keep your phone on.</p>
          <a
            href={`https://wa.me/?text=${shareText}`}
            target="_blank"
            rel="noreferrer"
            className="mt-5 block rounded-xl bg-card py-4 text-lg font-bold text-card-foreground"
          >
            Alert my family on WhatsApp
          </a>
          <Link to="/" className="mt-3 block text-sm font-semibold underline">Back to live dashboard</Link>
        </section>
      ) : (
        <form onSubmit={send} className="space-y-4 rounded-xl border bg-card p-5">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold"><Siren className="h-7 w-7 text-critical" /> Send SOS</h1>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {status === "granted"
              ? `Location ready: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`
              : status === "pending"
                ? "Getting your location…"
                : "Location unavailable — describe where you are below."}
          </p>
          <Field label="Your name *">
            <input className="w-full rounded-lg border-2 bg-background px-4 py-3 text-lg" value={form.name} maxLength={100}
              onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
          </Field>
          <Field label="Phone">
            <input className="w-full rounded-lg border-2 bg-background px-4 py-3 text-lg" value={form.phone} maxLength={20} inputMode="tel"
              onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
          </Field>
          <Field label="What's happening?">
            <textarea className="w-full rounded-lg border-2 bg-background px-4 py-3 text-lg" rows={3} value={form.message} maxLength={500}
              onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="e.g. trapped on 2nd floor, water rising" />
          </Field>
          {error && <p className="rounded-lg bg-critical px-3 py-2 font-semibold text-critical-foreground">{error}</p>}
          <button
            type="submit"
            disabled={state === "sending"}
            className="animate-sos w-full rounded-xl bg-critical py-6 font-display text-3xl font-extrabold text-critical-foreground disabled:opacity-60"
          >
            {state === "sending" ? "SENDING…" : "SEND SOS"}
          </button>
        </form>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-semibold">{label}</span>
      {children}
    </label>
  );
}
