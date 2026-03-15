import { parse, format } from "date-fns";

export function formatIDR(num: number | null | undefined): string {
  if (num == null) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
}

export function formatPct(num: number | null | undefined): string {
  if (num == null) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "percent",
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  }).format(num / 100);
}

export function formatNum(num: number | null | undefined): string {
  if (num == null) return "-";
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(num);
}

export function parseIdxDate(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr.length !== 8) return "-";
  try {
    const parsed = parse(dateStr, "yyyyMMdd", new Date());
    return format(parsed, "MMM d, yyyy");
  } catch (e) {
    return dateStr;
  }
}
