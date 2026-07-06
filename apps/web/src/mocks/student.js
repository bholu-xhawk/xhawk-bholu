// Deterministic Student mock utilities (ESM)

const GRADES = ['A', 'B', 'C', 'D', 'F'];

export function makeStudent(overrides = {}) {
  const id = overrides.id ?? 1;
  const computed = {
    id,
    name: `Student ${id}`,
    age: 18 + ((id - 1) % 5),
    grade: GRADES[(id - 1) % GRADES.length],
    enrolled_at: new Date(Date.UTC(2020, 0, 1 + (id - 1))).toISOString(),
  };

  return { ...computed, ...overrides };
}

export function makeStudentList(count = 3, overridesFn) {
  const students = [];
  for (let i = 0; i < count; i++) {
    const base = { id: i + 1 };
    const overrides = typeof overridesFn === 'function' ? overridesFn(i) : undefined;
    students.push(makeStudent({ ...base, ...(overrides || {}) }));
  }
  return students;
}
