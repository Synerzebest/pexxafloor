"use client";

import { useEffect, useState } from "react";
import { PackItem } from "@/context/CartContext";
import { parseSurface, readLastSurface, saveLastSurface } from "@/lib/lastSurface";

export function usePackConfig(
  existingPack?: PackItem,
  searchSurface?: string | null
) {
  const urlSurface = parseSurface(searchSurface);
  const [surface, setSurface] = useState(existingPack?.surface ?? urlSurface ?? 100);

  // Without a surface from the cart or the URL, reuse the last one typed (after mount, for hydration)
  useEffect(() => {
    if (existingPack || urlSurface !== null) return;
    const last = readLastSurface();
    if (last !== null) setSurface(last);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only the surface is remembered; the other settings reset on each pack, as before
  useEffect(() => {
    saveLastSurface(surface);
  }, [surface]);
  const [pasDePose, setPasDePose] = useState(existingPack?.pasDePose ?? 20);
  const [tuyauType, setTuyauType] = useState<"PERT" | "PERT-AL-PERT">(
    existingPack?.tuyauType ?? "PERT"
  );
  const [typeAgrafe, setTypeAgrafe] = useState<40 | 60>(
    existingPack?.typeAgrafe ?? 60
  );
  const [typeIsolation, setTypeIsolation] = useState<0 | 15 | 30>(
    existingPack?.typeIsolation ?? 0
  );

  return {
    surface,
    pasDePose,
    tuyauType,
    typeAgrafe,
    typeIsolation,
    setSurface,
    setPasDePose,
    setTuyauType,
    setTypeAgrafe,
    setTypeIsolation
  };
}
