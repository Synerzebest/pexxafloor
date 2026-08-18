"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "pexxafloor-cookie-consent";
const CONSENT_VERSION = 1;

type Consent = {
  version: number;
  externalServices: boolean;
  decidedAt: string;
};

type CookieConsentContextValue = {
  consent: Consent | null;
  ready: boolean;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  savePreferences: (externalServices: boolean) => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Consent;
        if (parsed.version === CONSENT_VERSION && typeof parsed.externalServices === "boolean") {
          setConsent(parsed);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setReady(true);
    }
  }, []);

  function savePreferences(externalServices: boolean) {
    const next: Consent = {
      version: CONSENT_VERSION,
      externalServices,
      decidedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setConsent(next);
    setSettingsOpen(false);
  }

  const value = useMemo<CookieConsentContextValue>(() => ({
    consent,
    ready,
    settingsOpen,
    openSettings: () => setSettingsOpen(true),
    closeSettings: () => setSettingsOpen(false),
    acceptAll: () => savePreferences(true),
    rejectNonEssential: () => savePreferences(false),
    savePreferences,
  }), [consent, ready, settingsOpen]);

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) throw new Error("useCookieConsent must be used inside CookieConsentProvider");
  return context;
}
