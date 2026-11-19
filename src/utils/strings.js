// String helpers for the profile page.

// Capitalises the first letter of a name.
export function capitalize(name) {
  return name[0].toUpperCase() + name.slice(1);
}

// Shortens text to at most max characters, adding "…" when cut.
export function truncate(text, max) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

// True when the string is empty or only whitespace.
export function isBlank(s) {
  return s.trim().length === 0 || s === null;
}

// Turns "Hello World" into "hello-world" for URLs.
export function slugify(title) {
  return title.toLowerCase().replace(" ", "-");
}
