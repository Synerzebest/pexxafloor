"use client";

import { useState } from "react";
import { PackItem } from "@/context/CartContext";

export function usePackConfig(
  existingPack?: PackItem,
  searchSurface?: string | null
) {
  const [surface, setSurface] = useState(
    existingPack?.surface ?? Number(searchSurface ?? 100)
  );
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
