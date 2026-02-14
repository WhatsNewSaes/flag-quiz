import { createContext, useContext, useEffect, useRef, useCallback, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface SyncContextValue {
  isSyncing: boolean;
  lastSyncedAt: number | null;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue>({
  isSyncing: false,
  lastSyncedAt: null,
  syncNow: async () => {},
});

// Keys we sync to the cloud
const JOURNEY_KEY = 'journey-progress';
const SETTINGS_KEYS = [
  'quiz-mode',
  'enabled-continents',
  'enabled-difficulties',
  'presentation-continents',
  'presentation-difficulties',
];

function readLocal(key: string): any {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

/** Notify all useLocalStorage hooks that cloud data arrived */
function dispatchCloudSync() {
  window.dispatchEvent(new Event('cloud-sync'));
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevUserId = useRef<string | null>(null);

  // Pull cloud data → localStorage
  const pullFromCloud = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_progress')
      .select('journey_progress, settings, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Failed to pull from cloud:', error.message);
      return false;
    }

    if (!data) return false; // No cloud data yet

    // Write journey progress to localStorage
    if (data.journey_progress && Object.keys(data.journey_progress).length > 0) {
      writeLocal(JOURNEY_KEY, data.journey_progress);
    }

    // Write settings to localStorage
    if (data.settings && typeof data.settings === 'object') {
      for (const key of SETTINGS_KEYS) {
        if (data.settings[key] !== undefined) {
          writeLocal(key, data.settings[key]);
        }
      }
    }

    dispatchCloudSync();
    return true;
  }, []);

  // Push localStorage → cloud
  const pushToCloud = useCallback(async (userId: string) => {
    const journeyProgress = readLocal(JOURNEY_KEY) || {};
    const settings: Record<string, any> = {};
    for (const key of SETTINGS_KEYS) {
      const val = readLocal(key);
      if (val !== null) settings[key] = val;
    }

    const { error } = await supabase
      .from('user_progress')
      .upsert({
        id: userId,
        journey_progress: journeyProgress,
        settings,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.warn('Failed to push to cloud:', error.message);
      return false;
    }

    setLastSyncedAt(Date.now());
    return true;
  }, []);

  // Full sync: pull then push (on sign-in)
  const syncNow = useCallback(async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const hasCloudData = await pullFromCloud(user.id);

      if (!hasCloudData) {
        // First sign-in: migrate localStorage to cloud
        await pushToCloud(user.id);
      } else {
        // Cloud data pulled and written to localStorage. Mark synced.
        setLastSyncedAt(Date.now());
      }
    } finally {
      setIsSyncing(false);
    }
  }, [user, pullFromCloud, pushToCloud]);

  // On sign-in: run initial sync
  useEffect(() => {
    if (!user) {
      prevUserId.current = null;
      return;
    }

    if (prevUserId.current === user.id) return;
    prevUserId.current = user.id;

    // Capture local data BEFORE pull overwrites it
    const localJourney = readLocal(JOURNEY_KEY);

    (async () => {
      setIsSyncing(true);
      try {
        const hasCloudData = await pullFromCloud(user.id);

        if (!hasCloudData) {
          // No cloud data: this is first sign-in. Push local data up.
          await pushToCloud(user.id);
        } else if (localJourney?.totalStars) {
          // Both exist: check if local has more progress
          const cloudJourney = readLocal(JOURNEY_KEY);
          if (localJourney.totalStars > (cloudJourney?.totalStars || 0)) {
            // Local has more progress — push it to cloud
            writeLocal(JOURNEY_KEY, localJourney);
            dispatchCloudSync();
            await pushToCloud(user.id);
          }
        }
        setLastSyncedAt(Date.now());
      } finally {
        setIsSyncing(false);
      }
    })();
  }, [user, pullFromCloud, pushToCloud]);

  // Watch localStorage for changes and debounce push to cloud
  useEffect(() => {
    if (!user) return;

    const handleStorageWrite = () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        pushToCloud(user.id);
      }, 2000);
    };

    // Listen for localStorage writes from useLocalStorage hooks
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (key: string, value: string) {
      originalSetItem.call(this, key, value);
      if (key === JOURNEY_KEY || SETTINGS_KEYS.includes(key)) {
        handleStorageWrite();
      }
    };

    return () => {
      localStorage.setItem = originalSetItem;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [user, pushToCloud]);

  return (
    <SyncContext.Provider value={{ isSyncing, lastSyncedAt, syncNow }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  return useContext(SyncContext);
}
