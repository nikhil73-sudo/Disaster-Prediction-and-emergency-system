import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-[1000] border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <ShieldAlert className="h-7 w-7 text-critical" />
          <span className="font-display text-xl font-extrabold tracking-tight">SurakshaNet</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            to="/"
            className="rounded-lg px-3 py-2 text-base font-semibold text-muted-foreground hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
            activeOptions={{ exact: true }}
          >
            Live
          </Link>
          <Link
            to="/sos"
            className="rounded-lg bg-critical px-4 py-2 text-base font-extrabold text-critical-foreground"
          >
            SOS
          </Link>
        </nav>
      </div>
    </header>
  );
}
