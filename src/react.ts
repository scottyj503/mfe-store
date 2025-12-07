/**
 * React bindings for mfe-store
 * Optional - only import if using React
 */

import { useEffect, useState, useCallback, useRef, useSyncExternalStore } from 'react';
import type { Store } from './store';

// ============================================================================
// Types
// ============================================================================

export interface UseStoreOptions {
  /** If true, suspends while loading initial value */
  suspense?: boolean;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * React hook to subscribe to a single key in the store
 */
export const useStoreValue = <T extends Record<string, unknown>, K extends keyof T>(
  store: Store<T>,
  key: K,
  initialValue?: T[K]
): [T[K] | undefined, (value: T[K]) => Promise<void>, boolean] => {
  const [value, setValue] = useState<T[K] | undefined>(initialValue);
  const [loading, setLoading] = useState(true);

  // Load initial value from store
  useEffect(() => {
    let mounted = true;

    store.get(key).then((storedValue) => {
      if (mounted) {
        setValue(storedValue);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [store, key]);

  // Subscribe to changes
  useEffect(() => {
    const unsubscribe = store.subscribe(key, (newValue) => {
      setValue(newValue);
    });

    return unsubscribe;
  }, [store, key]);

  // Setter function
  const setStoreValue = useCallback(
    async (newValue: T[K]) => {
      await store.set(key, newValue);
    },
    [store, key]
  );

  return [value, setStoreValue, loading];
};

/**
 * React hook using useSyncExternalStore for concurrent-safe subscriptions
 */
export const useStoreValueSync = <T extends Record<string, unknown>, K extends keyof T>(
  store: Store<T>,
  key: K,
  initialValue?: T[K]
): T[K] | undefined => {
  const cache = useRef<T[K] | undefined>(initialValue);

  // Initialize from store (async, but we use cache for sync access)
  useEffect(() => {
    store.get(key).then((value) => {
      cache.current = value;
    });
  }, [store, key]);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return store.subscribe(key, (newValue) => {
        cache.current = newValue;
        onStoreChange();
      });
    },
    [store, key]
  );

  const getSnapshot = useCallback(() => cache.current, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

/**
 * React hook to get all values from the store
 */
export const useStoreAll = <T extends Record<string, unknown>>(
  store: Store<T>
): [Partial<T>, boolean] => {
  const [values, setValues] = useState<Partial<T>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    store.getAll().then((all) => {
      if (mounted) {
        setValues(all);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [store]);

  return [values, loading];
};

/**
 * Factory to create typed hooks for a specific store
 */
export const createStoreHooks = <T extends Record<string, unknown>>(store: Store<T>) => {
  const useValue = <K extends keyof T>(key: K, initialValue?: T[K]) =>
    useStoreValue(store, key, initialValue);

  const useValueSync = <K extends keyof T>(key: K, initialValue?: T[K]) =>
    useStoreValueSync(store, key, initialValue);

  const useAll = () => useStoreAll(store);

  return { useValue, useValueSync, useAll };
};
