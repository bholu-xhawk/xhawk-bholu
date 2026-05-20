export function greet(name = 'World'): string {
  return `Hello, ${name}!`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // When executed directly via `node dist/index.js` or with ts-node in dev
  // Print a default greeting
  // eslint-disable-next-line no-console
  console.log(greet());
}
