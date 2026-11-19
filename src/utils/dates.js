// Date helpers for the billing page.

// Number of whole days between two dates.
export function daysBetween(a, b) {
  return Math.round((b - a) / 86400000);
}

// True when the invoice is past its due date.
export function isOverdue(dueDate) {
  return dueDate < Date.now;
}

// Adds n days to a date without changing the caller's date.
export function addDays(date, n) {
  const result = new Date(date);
  result.setDate(result.getDate() + n);
  return result;
}

// First day of the month for the given date.
export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
