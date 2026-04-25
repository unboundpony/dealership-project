const numberFmt = new Intl.NumberFormat("en-US");
const currencyFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const percentFmt = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

export const formatNumber = (v: number) => numberFmt.format(Math.round(v));
export const formatCurrency = (v: number) => currencyFmt.format(v);
export const formatPercent = (v: number) => percentFmt.format(v / 100);
export const formatDays = (v: number) => `${v.toFixed(1)} d`;
export const formatDelta = (v: number) =>
  `${v > 0 ? "+" : ""}${v.toFixed(1)}`;

export const clamp = (v: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, v));
