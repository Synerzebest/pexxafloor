"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCookieConsent } from "@/context/CookieConsentContext";

export default function CookieConsentBanner() {
  const locale = useLocale();
  const t = useTranslations("CookieConsent");
  const {
    consent,
    ready,
    settingsOpen,
    openSettings,
    closeSettings,
    acceptAll,
    rejectNonEssential,
    savePreferences,
  } = useCookieConsent();
  const [externalServices, setExternalServices] = useState(false);

  useEffect(() => {
    if (settingsOpen) setExternalServices(consent?.externalServices ?? false);
  }, [settingsOpen, consent]);

  if (!ready) return null;

  return (
    <>
      {!consent && !settingsOpen && (
        <aside className="fixed bottom-3 left-3 right-3 z-[200] mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-2xl backdrop-blur sm:bottom-5 sm:p-5" role="dialog" aria-label={t("title")}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="hidden h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600 sm:grid"><Cookie className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-gray-950">{t("title")}</h2>
              <p className="mt-1 text-xs leading-5 text-gray-600">{t("description")} <Link href={`/${locale}/cookies`} className="font-medium text-orange-700 underline underline-offset-2">{t("learnMore")}</Link></p>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
              <button type="button" onClick={rejectNonEssential} className="min-h-10 rounded-xl border border-gray-300 bg-white px-4 text-xs font-semibold text-gray-800 transition hover:bg-gray-50">{t("reject")}</button>
              <button type="button" onClick={acceptAll} className="min-h-10 rounded-xl bg-orange-600 px-4 text-xs font-semibold text-white transition hover:bg-orange-700">{t("accept")}</button>
              <button type="button" onClick={openSettings} className="col-span-2 min-h-9 px-3 text-xs font-medium text-gray-600 underline underline-offset-2 sm:order-first sm:no-underline">{t("customize")}</button>
            </div>
          </div>
        </aside>
      )}

      {settingsOpen && (
        <div className="fixed inset-0 z-[210] grid place-items-center bg-gray-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="cookie-settings-title">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-wider text-orange-600">PexxaFloor</p><h2 id="cookie-settings-title" className="mt-1 text-xl font-bold text-gray-950">{t("settingsTitle")}</h2></div>
              {consent && <button type="button" onClick={closeSettings} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100" aria-label={t("close")}><X className="h-5 w-5" /></button>}
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-600">{t("settingsDescription")}</p>

            <div className="mt-6 space-y-3">
              <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 p-4">
                <div><div className="flex items-center gap-2 font-semibold text-gray-900"><ShieldCheck className="h-4 w-4 text-emerald-600" />{t("necessaryTitle")}</div><p className="mt-1 text-xs leading-5 text-gray-500">{t("necessaryDescription")}</p></div>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{t("alwaysActive")}</span>
              </div>
              <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-gray-200 p-4">
                <div><p className="font-semibold text-gray-900">{t("externalTitle")}</p><p className="mt-1 text-xs leading-5 text-gray-500">{t("externalDescription")}</p></div>
                <input type="checkbox" checked={externalServices} onChange={(event) => setExternalServices(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-orange-600" />
              </label>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              <button type="button" onClick={rejectNonEssential} className="min-h-11 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50">{t("reject")}</button>
              <button type="button" onClick={() => savePreferences(externalServices)} className="min-h-11 rounded-xl border border-orange-300 px-4 text-sm font-semibold text-orange-700 hover:bg-orange-50">{t("save")}</button>
              <button type="button" onClick={acceptAll} className="min-h-11 rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-700">{t("accept")}</button>
            </div>
            <p className="mt-4 text-center text-xs text-gray-400"><Link href={`/${locale}/cookies`} className="underline underline-offset-2">{t("learnMore")}</Link></p>
          </div>
        </div>
      )}
    </>
  );
}
