// Student mock utilities (ESM)

export function makeStudent(overrides = {}) {
  const id = overrides.id ?? overrides.number ?? 1;
  const firstName = overrides.firstName ?? `Student${id}`;
  const lastName = overrides.lastName ?? 'User';
  const email = overrides.email ?? `student${id}@example.com`;
  const grades = ['A', 'B', 'C', 'D'];
  const grade = overrides.grade ?? grades[(id - 1) % grades.length];
  const now = new Date();
  const enrolledAt = overrides.enrolledAt ?? new Date(now.getTime() - id * 24 * 60 * 60 * 1000).toISOString();

  const computed = {
    id,
    firstName,
    lastName,
    email,
    grade,
    enrolledAt,
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
