import { useEffect, useState } from "react";
import { DEFAULT_LOCATION } from "@/lib/disaster";

export function useLocation() {
  const [loc, setLoc] = useState(DEFAULT_LOCATION);
  const [status, setStatus] = useState<"pending" | "granted" | "denied">("pending");

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLoc({ lat: p.coords.latitude, lng: p.coords.longitude });
        setStatus("granted");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  return { loc, status };
}
