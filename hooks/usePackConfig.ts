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
  const [typeAgrafe, setTypeAgrafe] = useState<40 | 60>(40);

  return {
    surface,
    pasDePose,
    tuyauType,
    typeAgrafe,
    setSurface,
    setPasDePose,
    setTuyauType,
    setTypeAgrafe,
  };
}
