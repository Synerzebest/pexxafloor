'use client';
import { useState } from 'react';
import SurfaceCalculator from './SurfaceCalculator';
import SystemSection from './SystemSection';

export default function SurfaceWrapper() {
  const [surface, setSurface] = useState<string>('');

  return (
    <>
      <SurfaceCalculator surface={surface} setSurface={setSurface} />
      <SystemSection surface={surface} setSurface={setSurface} />
    </>
  );
}
