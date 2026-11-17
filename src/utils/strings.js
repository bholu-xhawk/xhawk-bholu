// String helpers for display names.

function truncate(text, max) {
  if (text.length > max) return text.slice(0, max) + "...";
  return text;
}

function initials(fullName) {
  return fullName.split(" ").filter(Boolean).map((p) => p[0]).join("");
}

function slugify(title) {
  return title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
}

module.exports = { truncate, initials, slugify };
