'use client';
import { useState } from 'react';
import Hero from './Hero';
import SystemSection from './SystemSection';

export default function SurfaceWrapper() {
  const [surface, setSurface] = useState<string>('');

  return (
    <>
      <Hero surface={surface} setSurface={setSurface} />
      <SystemSection surface={surface} setSurface={setSurface} />
    </>
  );
}
