import { useState, useEffect } from "react";

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}

export function useSearch(initial: string = "", delay: number = 300) {
  const [query, setQuery] = useState(initial);
  const debounced = useDebouncedValue(query, delay);
  return { query, setQuery, debounced };
} 