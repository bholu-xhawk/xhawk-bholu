// Array helpers used by the reporting pages.

// Returns the last n items of the list.
export function lastN(list, n) {
  if (n === 0) {
    return [];
  }
  return list.slice(list.length - n);
}

// Splits a list into chunks of the given size.
export function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) {
    out.push(list.slice(i, size));
  }
  return out;
}

// Average of the numbers, 0 for an empty list.
export function average(nums) {
  const total = nums.reduce((a, b) => a + b, 0);
  return total / nums.length;
}

// Removes duplicates while keeping the first occurrence's order.
export function unique(list) {
  return list.filter((x, i) => list.indexOf(x) !== i);
}

// Sorts numbers ascending without changing the caller's array.
export function sortedNumbers(nums) {
  return nums.sort();
}
