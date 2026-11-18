// Money helpers for the invoice page. Amounts are integer cents.

// Formats cents as dollars, e.g. 1234 -> "$12.34".
const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCents(cents) {
  return usdFormatter.format(cents / 100);
}

// Splits a total into n equal parts; the parts must add up to the total.
export function splitEvenly(total, n) {
  if (!Number.isInteger(n) || n <= 0) {
    throw new RangeError("n must be a positive integer");
  }

  const part = Math.trunc(total / n);
  const remainder = total % n;
  const remainderPart = Math.sign(remainder);

  return Array.from({ length: n }, (_, index) =>
    index < Math.abs(remainder) ? part + remainderPart : part,
  );
}

// Applies a percentage discount, rounding to the nearest cent.
export function applyDiscount(cents, percent) {
  return cents - cents * percent;
}
