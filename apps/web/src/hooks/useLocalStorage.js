import { useState, useEffect } from 'react';

// Simple localStorage-backed state hook with JSON serialization
export default function useLocalStorage(key, initialValue) {
  const readValue = () => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item != null ? JSON.parse(item) : initialValue;
    } catch (e) {
      // Fallback to initial value on parse error
      return initialValue;
    }
  };

  const [value, setValue] = useState(readValue);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      // ignore write errors
    }
  }, [key, value]);

  return [value, setValue];
}
