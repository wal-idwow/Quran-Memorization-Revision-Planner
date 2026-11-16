import { StoredState } from '../types/quran';

const IDB_NAME = 'itqan_db_v1';
const IDB_VERSION = 1;
const IDB_STORE = 'app_state';
const IDB_KEY = 'current_state';

/**
 * Requests persistent storage from the browser so mobile OSes (e.g., iOS Safari / Android)
 * do not evict local progress under storage pressure.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
    return false;
  }
  try {
    const alreadyPersisted = await navigator.storage.persisted?.();
    if (alreadyPersisted) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

function openIDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Saves a redundant mirror of the user's progress state into IndexedDB.
 */
export async function saveStateToIDB(state: StoredState): Promise<void> {
  const db = await openIDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(state, IDB_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

/**
 * Loads the backup mirror state from IndexedDB if available.
 */
export async function loadStateFromIDB<T = StoredState>(): Promise<T | null> {
  const db = await openIDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY);
      req.onsuccess = () => {
        db.close();
        resolve((req.result as T) ?? null);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validates and parses an imported JSON backup file (supports wrapped `{ state }` or raw StoredState).
 */
export function validateBackupPayload(
  raw: string
): { ok: true; state: StoredState } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'INVALID_JSON' };
  }

  if (!isPlainObject(parsed)) {
    return { ok: false, error: 'INVALID_STRUCTURE' };
  }

  const candidate = isPlainObject(parsed.state) ? parsed.state : parsed;

  if (!Array.isArray(candidate.plans) || !Array.isArray(candidate.sessions)) {
    return { ok: false, error: 'MISSING_CORE_ARRAYS' };
  }

  if (!isPlainObject(candidate.progressMap)) {
    return { ok: false, error: 'MISSING_PROGRESS_MAP' };
  }

  const reminderSettings = candidate.reminderSettings;
  if (!isPlainObject(reminderSettings) || !Array.isArray(reminderSettings.rules)) {
    return { ok: false, error: 'MISSING_REMINDERS' };
  }

  const normalizedState: StoredState = {
    lang: candidate.lang === 'en' ? 'en' : 'ar',
    theme: candidate.theme === 'dark' ? 'dark' : 'light',
    plans: candidate.plans as StoredState['plans'],
    sessions: candidate.sessions as StoredState['sessions'],
    progressMap: candidate.progressMap as StoredState['progressMap'],
    reminderSettings: reminderSettings as unknown as StoredState['reminderSettings'],
    notifications: Array.isArray(candidate.notifications)
      ? (candidate.notifications as StoredState['notifications'])
      : [],
    manzilCycleDays:
      typeof candidate.manzilCycleDays === 'number' && candidate.manzilCycleDays > 0
        ? candidate.manzilCycleDays
        : 7,
    isDemoMode: false,
  };

  return { ok: true, state: normalizedState };
}
