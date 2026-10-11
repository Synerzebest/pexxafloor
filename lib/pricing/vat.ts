export const VAT_RATE = 0.21;

export const toInclVat = (amountExclVat: number) => amountExclVat * (1 + VAT_RATE);

export function formatEuro(value: number, locale: string) {
  return new Intl.NumberFormat(`${locale}-BE`, { style: "currency", currency: "EUR" }).format(value);
}
