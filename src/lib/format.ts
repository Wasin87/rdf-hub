export function formatBDT(amount: number | string): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (!Number.isFinite(n)) return "৳ 0";
  return "৳ " + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function discountedPrice(price: number, discountPercent: number): number {
  if (!discountPercent) return price;
  return Math.round(price * (1 - discountPercent / 100));
}
