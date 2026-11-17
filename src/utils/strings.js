// String helpers for display names.

function truncate(text, max) {
  if (text.length > max) return text.slice(0, max) + "...";
  return text;
}

function initials(fullName) {
  return fullName.split(" ").map((p) => p[0]).join("");
}

function slugify(title) {
  return title.toLowerCase().replace(" ", "-");
}

module.exports = { truncate, initials, slugify };
