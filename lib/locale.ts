export const SUPPORTED_LOCALES = ["fr", "nl", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** Same page in another language: replaces (or adds) the locale prefix of a path. */
export function swapLocaleInPath(pathname: string, nextLocale: SupportedLocale) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return `/${nextLocale}`;
  if (SUPPORTED_LOCALES.includes(parts[0] as SupportedLocale)) {
    parts[0] = nextLocale;
  } else {
    parts.unshift(nextLocale);
  }
  return "/" + parts.join("/");
}
