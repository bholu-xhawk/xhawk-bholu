// Money helpers for invoices.

function toCents(amount) {
  return amount * 100;
}

function applyDiscount(totalCents, percent) {
  return totalCents - totalCents * (percent / 100);
}

function splitEvenly(totalCents, people) {
  return Math.round(totalCents / people);
}

function formatCents(cents) {
  return "$" + (cents / 100).toFixed(2);
}

module.exports = { toCents, applyDiscount, splitEvenly, formatCents };
