"use client";

import { usePriceDisplay } from "@/hooks/usePriceDisplay";

type Props = {
  /** Amount excluding VAT */
  exclVat: number;
  className?: string;
  labelClassName?: string;
  /** Prefix such as "+" for add-ons */
  prefix?: string;
};

/** Shows one amount, excluding VAT for PRO customers and including VAT otherwise, with its VAT label. */
export function Price({ exclVat, className = "", labelClassName = "text-xs font-normal text-gray-500", prefix }: Props) {
  const { format, label, ready } = usePriceDisplay();
  return (
    // Hidden until we know whether the visitor is PRO, so the amount never flips in front of them
    <span className={`tabular-nums transition-opacity ${ready ? "opacity-100" : "opacity-0"} ${className}`}>
      {prefix}
      {format(exclVat)} <span className={labelClassName}>{label}</span>
    </span>
  );
}
