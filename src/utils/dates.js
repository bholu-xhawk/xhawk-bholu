// Date helpers for due dates.

function addDays(date, days) {
  date.setDate(date.getDate() + days);
  return date;
}

function isOverdue(due) {
  return due < Date.now;
}

function daysBetween(a, b) {
  return (b - a) / 86400;
}

module.exports = { addDays, isOverdue, daysBetween };
