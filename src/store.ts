/**
 * mfe-store
 * A lightweight, framework-agnostic state store using IndexedDB + pub/sub
 */

// ============================================================================
// Types
// ============================================================================

export type Listener<T> = (value: T, oldValue: T | undefined) => void;
export type Unsubscribe = () => void;
export type Validator<T> = (value: T) => void | never;

export interface StoreOptions<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Database name for IndexedDB (default: 'mfe-store') */
  dbName?: string;
  /** Store name within the database (default: 'store') */
  storeName?: string;
  /** Channel name for cross-tab sync (default: dbName) */
  channelName?: string;
  /** Validators for each key - throw an error to reject invalid values */
  validators?: { [K in keyof T]?: Validator<T[K]> };
}

export interface Store<T extends Record<string, unknown>> {
  get: <K extends keyof T>(key: K) => Promise<T[K] | undefined>;
  set: <K extends keyof T>(key: K, value: T[K]) => Promise<void>;
  delete: <K extends keyof T>(key: K) => Promise<void>;
  subscribe: <K extends keyof T>(key: K, listener: Listener<T[K]>) => Unsubscribe;
  getAll: () => Promise<Partial<T>>;
  clear: () => Promise<void>;
  destroy: () => void;
}

interface BroadcastMessage<T, K extends keyof T = keyof T> {
  type: 'set' | 'delete' | 'clear';
  key?: K;
  value?: T[K];
  oldValue?: T[K];
}

// ============================================================================
// IndexedDB helpers
// ============================================================================

const openDatabase = (dbName: string, storeName: string): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
  });
};

const dbGet = <T>(
  db: IDBDatabase,
  storeName: string,
  key: string
): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

const dbSet = <T>(
  db: IDBDatabase,
  storeName: string,
  key: string,
  value: T
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(value, key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

const dbDelete = (
  db: IDBDatabase,
  storeName: string,
  key: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

const dbGetAll = <T extends Record<string, unknown>>(
  db: IDBDatabase,
  storeName: string
): Promise<Partial<T>> => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.openCursor();
    const result: Record<string, unknown> = {};

    request.onerror = () => reject(request.error);
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        result[cursor.key as string] = cursor.value;
        cursor.continue();
      } else {
        resolve(result as Partial<T>);
      }
    };
  });
};

const dbClear = (db: IDBDatabase, storeName: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// ============================================================================
// Event helpers
// ============================================================================

const createEventName = (channelName: string, key: string): string =>
  `store:${channelName}:${key}`;

const emitLocalEvent = <T>(
  channelName: string,
  key: string,
  value: T,
  oldValue: T | undefined
): void => {
  window.dispatchEvent(
    new CustomEvent(createEventName(channelName, key), {
      detail: { value, oldValue },
    })
  );
};

// ============================================================================
// Store factory
// ============================================================================

export const createStore = <T extends Record<string, unknown>>(
  options: StoreOptions<T> = {}
): Store<T> => {
  const {
    dbName = 'mfe-store',
    storeName = 'store',
    channelName = dbName,
    validators,
  } = options;

  // In-memory cache for synchronous access patterns
  const cache = new Map<keyof T, T[keyof T]>();
  const listeners = new Map<keyof T, Set<Listener<T[keyof T]>>>();

  // Database connection (lazy initialized)
  let dbPromise: Promise<IDBDatabase> | null = null;

  const getDb = (): Promise<IDBDatabase> => {
    if (!dbPromise) {
      dbPromise = openDatabase(dbName, storeName);
    }
    return dbPromise;
  };

  // Cross-tab communication
  const channel = new BroadcastChannel(channelName);

  const notifyListeners = <K extends keyof T>(
    key: K,
    value: T[K],
    oldValue: T[K] | undefined
  ): void => {
    const keyListeners = listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach((listener) => listener(value, oldValue));
    }
    // Emit CustomEvent for in-page pub/sub (micro frontends)
    emitLocalEvent(channelName, key as string, value, oldValue);
  };

  // Handle messages from other tabs
  channel.onmessage = (event: MessageEvent<BroadcastMessage<T>>) => {
    const { type, key, value, oldValue } = event.data;

    if (type === 'set' && key !== undefined && value !== undefined) {
      cache.set(key, value as T[keyof T]);
      notifyListeners(key, value as T[typeof key], oldValue as T[typeof key] | undefined);
    } else if (type === 'delete' && key !== undefined) {
      const old = cache.get(key);
      cache.delete(key);
      notifyListeners(key, undefined as T[typeof key], old as T[typeof key] | undefined);
    } else if (type === 'clear') {
      cache.clear();
      // Notify all listeners with undefined
      listeners.forEach((_, key) => {
        notifyListeners(key, undefined as T[typeof key], undefined);
      });
    }
  };

  // Public API
  const get = async <K extends keyof T>(key: K): Promise<T[K] | undefined> => {
    // Check cache first
    if (cache.has(key)) {
      return cache.get(key) as T[K];
    }
    // Fall back to IndexedDB
    const db = await getDb();
    const value = await dbGet<T[K]>(db, storeName, key as string);
    if (value !== undefined) {
      cache.set(key, value);
    }
    return value;
  };

  const set = async <K extends keyof T>(key: K, value: T[K]): Promise<void> => {
    // Run validator if provided (throws on invalid)
    const validator = validators?.[key];
    if (validator) {
      validator(value);
    }

    const oldValue = cache.get(key) as T[K] | undefined;
    cache.set(key, value);

    const db = await getDb();
    await dbSet(db, storeName, key as string, value);

    // Notify local listeners
    notifyListeners(key, value, oldValue);

    // Broadcast to other tabs
    channel.postMessage({ type: 'set', key, value, oldValue } as BroadcastMessage<T>);
  };

  const del = async <K extends keyof T>(key: K): Promise<void> => {
    const oldValue = cache.get(key) as T[K] | undefined;
    cache.delete(key);

    const db = await getDb();
    await dbDelete(db, storeName, key as string);

    // Notify local listeners
    notifyListeners(key, undefined as T[K], oldValue);

    // Broadcast to other tabs
    channel.postMessage({ type: 'delete', key, oldValue } as BroadcastMessage<T>);
  };

  const subscribe = <K extends keyof T>(
    key: K,
    listener: Listener<T[K]>
  ): Unsubscribe => {
    if (!listeners.has(key)) {
      listeners.set(key, new Set());
    }
    listeners.get(key)!.add(listener as Listener<T[keyof T]>);

    // Return unsubscribe function
    return () => {
      const keyListeners = listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(listener as Listener<T[keyof T]>);
        if (keyListeners.size === 0) {
          listeners.delete(key);
        }
      }
    };
  };

  const getAll = async (): Promise<Partial<T>> => {
    const db = await getDb();
    const all = await dbGetAll<T>(db, storeName);
    // Update cache
    Object.entries(all).forEach(([key, value]) => {
      cache.set(key as keyof T, value as T[keyof T]);
    });
    return all;
  };

  const clear = async (): Promise<void> => {
    cache.clear();

    const db = await getDb();
    await dbClear(db, storeName);

    // Notify all listeners
    listeners.forEach((_, key) => {
      notifyListeners(key, undefined as T[typeof key], undefined);
    });

    // Broadcast to other tabs
    channel.postMessage({ type: 'clear' } as BroadcastMessage<T>);
  };

  const destroy = (): void => {
    channel.close();
    listeners.clear();
    cache.clear();
    dbPromise = null;
  };

  return {
    get,
    set,
    delete: del,
    subscribe,
    getAll,
    clear,
    destroy,
  };
};

// ============================================================================
// Standalone subscribe (for micro frontends without store reference)
// ============================================================================

export const subscribeToKey = <T>(
  channelName: string,
  key: string,
  listener: Listener<T>
): Unsubscribe => {
  const eventName = createEventName(channelName, key);

  const handler = (event: Event) => {
    const { value, oldValue } = (event as CustomEvent<{ value: T; oldValue: T | undefined }>).detail;
    listener(value, oldValue);
  };

  window.addEventListener(eventName, handler);

  return () => {
    window.removeEventListener(eventName, handler);
  };
};
