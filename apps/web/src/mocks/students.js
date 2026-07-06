// Mock student data utilities
// Data model: { id: number, name: string, age: number, grade: string }

const GRADES = ["A", "B", "C", "D"];

export function makeStudent(overrides = {}) {
  const id = overrides.id ?? 1;
  const name = overrides.name ?? `Student ${id}`;
  // age cycles 18–25 inclusive based on id
  const age = overrides.age ?? 18 + ((id - 1) % 8);
  // grade cycles A–D based on id
  const grade = overrides.grade ?? GRADES[(id - 1) % GRADES.length];

  return { id, name, age, grade };
}

export function makeStudentList(count = 50) {
  const list = [];
  for (let i = 1; i <= count; i++) {
    list.push(
      makeStudent({
        id: i,
        name: `Student ${i}`,
      })
    );
  }
  return list;
}
