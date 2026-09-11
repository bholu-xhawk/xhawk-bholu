export const TODO_STORAGE_KEY = 'web.todos';

function hasLocalStorage() {
  return (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  );
}

function normalizeTodo(item, index) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const title = typeof item.title === 'string' ? item.title.trim() : '';

  if (!title) {
    return null;
  }

  const id =
    typeof item.id === 'string' && item.id.trim()
      ? item.id
      : `todo-${Date.now()}-${index}`;
  const createdAt =
    typeof item.createdAt === 'string' && item.createdAt.trim()
      ? item.createdAt
      : new Date().toISOString();

  return {
    id,
    title,
    completed: Boolean(item.completed),
    createdAt,
  };
}

export function loadTodos() {
  if (!hasLocalStorage()) {
    return [];
  }

  try {
    const rawTodos = window.localStorage.getItem(TODO_STORAGE_KEY);

    if (!rawTodos) {
      return [];
    }

    const parsedTodos = JSON.parse(rawTodos);

    if (!Array.isArray(parsedTodos)) {
      return [];
    }

    return parsedTodos.map(normalizeTodo).filter(Boolean);
  } catch (_error) {
    return [];
  }
}

export function saveTodos(todos) {
  if (!hasLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
  } catch (_error) {
    // Ignore storage failures so the UI can keep working in-memory.
  }
}
