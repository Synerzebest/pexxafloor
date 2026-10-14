'use client';
import { useEffect, useState } from 'react';
import SurfaceCalculator from './SurfaceCalculator';
import SystemSection from './SystemSection';
import { readLastSurface, saveLastSurface, parseSurface } from '@/lib/lastSurface';

export default function SurfaceWrapper() {
  const [surface, setSurface] = useState<string>('');

  // Restore after mount (not in the initial state) to keep server and client HTML identical
  useEffect(() => {
    const last = readLastSurface();
    if (last !== null) setSurface(String(last));
  }, []);

  const updateSurface = (value: string) => {
    setSurface(value);
    const parsed = parseSurface(value);
    if (parsed !== null) saveLastSurface(parsed);
  };

  return (
    <>
      <SurfaceCalculator surface={surface} setSurface={updateSurface} />
      <SystemSection surface={surface} setSurface={updateSurface} />
    </>
  );
}
