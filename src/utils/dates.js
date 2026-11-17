// Date helpers for due dates.

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isOverdue(due) {
  return due < Date.now();
}

function daysBetween(a, b) {
  return (b - a) / 86400000;
}

module.exports = { addDays, isOverdue, daysBetween };
