// Money helpers for the invoice page. Amounts are integer cents.

// Formats cents as dollars, e.g. 1234 -> "$12.34".
export function formatCents(cents) {
  return "$" + cents / 100;
}

// Splits a total into n equal parts; the parts must add up to the total.
export function splitEvenly(total, n) {
  const part = Math.floor(total / n);
  return Array(n).fill(part);
}

// Applies a percentage discount, rounding to the nearest cent.
export function applyDiscount(cents, percent) {
  return cents - cents * percent;
}
