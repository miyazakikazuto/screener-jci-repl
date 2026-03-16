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
  if (!dateStr) return "-";
  try {
    if (dateStr.length === 8) {
      const parsed = parse(dateStr, "yyyyMMdd", new Date());
      return format(parsed, "d MMM yyyy");
    }
    if (dateStr.length === 10) {
      const parsed = parse(dateStr, "yyyy-MM-dd", new Date());
      return format(parsed, "d MMM yyyy");
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function parseIdxDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    if (dateStr.length === 8) {
      const parsed = parse(dateStr, "yyyyMMdd", new Date());
      return format(parsed, "d MMM");
    }
    if (dateStr.length === 10) {
      const parsed = parse(dateStr, "yyyy-MM-dd", new Date());
      return format(parsed, "d MMM");
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}
