import { useCallback, useEffect, useState } from "react";

function read<T>(key: string, initialValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : initialValue;
  } catch {
    return initialValue;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [state, setState] = useState(() => ({ key, value: read(key, initialValue) }));

  // If the key changes (e.g. a storage version bump while the dev server is hot-reloading),
  // load that key's data instead of carrying the old key's data over and overwriting it.
  let value = state.value;
  if (state.key !== key) {
    value = read(key, initialValue);
    setState({ key, value });
  }

  const setValue = useCallback((next: T) => setState({ key, value: next }), [key]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage unavailable (private mode, quota) - keep working in memory
    }
  }, [key, value]);

  return [value, setValue] as const;
}
