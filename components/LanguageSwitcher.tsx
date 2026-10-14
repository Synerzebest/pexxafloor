"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Globe } from "lucide-react";

const LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "nl", label: "Nederlands" },
  { code: "en", label: "English" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

type Props = {
  locale: string;
  onSelect: (locale: LanguageCode) => void;
  /** "dropdown" for the desktop navbar, "segmented" for the mobile drawer */
  variant?: "dropdown" | "segmented";
};

export default function LanguageSwitcher({ locale, onSelect, variant = "dropdown" }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = (code: LanguageCode) => {
    setOpen(false);
    if (code !== locale) onSelect(code);
  };

  if (variant === "segmented") {
    return (
      <div role="radiogroup" aria-label="Language" className="inline-flex shrink-0 rounded-lg bg-gray-100 p-1">
        {LANGUAGES.map(({ code, label }) => {
          const active = code === locale;
          return (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={label}
              lang={code}
              onClick={() => choose(code)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase transition ${
                active ? "bg-white text-orange-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {code}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={LANGUAGES.find((language) => language.code === locale)?.label}
        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold uppercase text-gray-700 shadow-sm transition hover:border-orange-300 hover:text-orange-700 cursor-pointer"
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        {locale}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-xl"
          >
            {LANGUAGES.map(({ code, label }) => {
              const active = code === locale;
              return (
                <li key={code} role="option" aria-selected={active}>
                  <button
                    type="button"
                    lang={code}
                    onClick={() => choose(code)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                      active ? "bg-orange-50 font-semibold text-orange-700" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="w-6 text-xs font-semibold uppercase text-gray-400">{code}</span>
                    <span className="flex-1">{label}</span>
                    {active && <Check className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
