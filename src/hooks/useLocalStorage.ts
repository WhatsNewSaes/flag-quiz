import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  migrate?: (raw: any) => T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return initialValue;
      const parsed = JSON.parse(item);
      return migrate ? migrate(parsed) : parsed;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Re-read from localStorage when cloud sync pushes new data
  const handleCloudSync = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return;
      const parsed = JSON.parse(item);
      const value = migrate ? migrate(parsed) : parsed;
      setStoredValue(value);
    } catch (error) {
      console.warn(`Error re-reading localStorage key "${key}" after sync:`, error);
    }
  }, [key, migrate]);

  useEffect(() => {
    window.addEventListener('cloud-sync', handleCloudSync);
    return () => window.removeEventListener('cloud-sync', handleCloudSync);
  }, [handleCloudSync]);

  return [storedValue, setStoredValue];
}
