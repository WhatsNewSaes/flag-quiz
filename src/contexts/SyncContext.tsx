import { createContext, useContext, useEffect, useRef, useCallback, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { JourneyProgressData } from '../hooks/useJourneyProgress';

interface SyncState {
  isSyncing: boolean;
  lastSyncedAt: number | null;
  hasSynced: boolean;
}

interface SyncContextValue extends SyncState {
  /** Push local progress to the cloud. Called automatically on changes. */
  pushProgress: (progress: JourneyProgressData) => void;
  /** Push local settings to the cloud. Called automatically on changes. */
  pushSettings: (settings: Record<string, unknown>) => void;
  /** Pull latest data from the cloud. Called on sign-in. */
  pullFromCloud: () => Promise<{
    journeyProgress: JourneyProgressData | null;
    settings: Record<string, unknown> | null;
  }>;
  /** Migrate localStorage data to cloud on first sign-in. */
  migrateLocalToCloud: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

const DEBOUNCE_MS = 1000;

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSyncedAt: null,
    hasSynced: false,
  });

  // Debounce timers
  const progressTimer = useRef<ReturnType<typeof setTimeout>>();
  const settingsTimer = useRef<ReturnType<typeof setTimeout>>();

  // Track if we've done initial pull for this user session
  const initialPullDone = useRef(false);
  const prevUserId = useRef<string | null>(null);

  // Reset initial pull flag when user changes
  useEffect(() => {
    if (user?.id !== prevUserId.current) {
      initialPullDone.current = false;
      prevUserId.current = user?.id ?? null;
    }
  }, [user?.id]);

  const pushProgress = useCallback(
    (progress: JourneyProgressData) => {
      if (!user) return;

      if (progressTimer.current) clearTimeout(progressTimer.current);
      progressTimer.current = setTimeout(async () => {
        try {
          setSyncState(prev => ({ ...prev, isSyncing: true }));
          await supabase.from('user_progress').upsert(
            {
              id: user.id,
              journey_progress: progress,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
          setSyncState(prev => ({
            ...prev,
            isSyncing: false,
            lastSyncedAt: Date.now(),
          }));
        } catch (err) {
          console.warn('Failed to push progress:', err);
          setSyncState(prev => ({ ...prev, isSyncing: false }));
        }
      }, DEBOUNCE_MS);
    },
    [user]
  );

  const pushSettings = useCallback(
    (settings: Record<string, unknown>) => {
      if (!user) return;

      if (settingsTimer.current) clearTimeout(settingsTimer.current);
      settingsTimer.current = setTimeout(async () => {
        try {
          await supabase.from('user_progress').upsert(
            {
              id: user.id,
              settings,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        } catch (err) {
          console.warn('Failed to push settings:', err);
        }
      }, DEBOUNCE_MS);
    },
    [user]
  );

  const pullFromCloud = useCallback(async () => {
    if (!user) return { journeyProgress: null, settings: null };

    try {
      setSyncState(prev => ({ ...prev, isSyncing: true }));
      const { data, error } = await supabase
        .from('user_progress')
        .select('journey_progress, settings')
        .eq('id', user.id)
        .maybeSingle();

      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncedAt: Date.now(),
        hasSynced: true,
      }));

      if (error) {
        console.warn('Failed to pull from cloud:', error);
        return { journeyProgress: null, settings: null };
      }

      if (!data) return { journeyProgress: null, settings: null };

      return {
        journeyProgress: data.journey_progress as JourneyProgressData | null,
        settings: data.settings as Record<string, unknown> | null,
      };
    } catch (err) {
      console.warn('Failed to pull from cloud:', err);
      setSyncState(prev => ({ ...prev, isSyncing: false }));
      return { journeyProgress: null, settings: null };
    }
  }, [user]);

  const migrateLocalToCloud = useCallback(async () => {
    if (!user) return;

    try {
      // Check if user already has cloud data
      const { data: existing } = await supabase
        .from('user_progress')
        .select('id, journey_progress')
        .eq('id', user.id)
        .maybeSingle();

      // Read local progress
      const localRaw = window.localStorage.getItem('journey-progress');
      const localProgress: JourneyProgressData | null = localRaw ? JSON.parse(localRaw) : null;

      // Read local settings
      const localSettings: Record<string, unknown> = {};
      const settingsKeys = [
        'quiz-mode',
        'enabled-continents',
        'enabled-difficulties',
        'presentation-continents',
        'presentation-difficulties',
      ];
      for (const key of settingsKeys) {
        const val = window.localStorage.getItem(key);
        if (val) {
          try { localSettings[key] = JSON.parse(val); } catch { /* skip */ }
        }
      }

      if (existing?.journey_progress && Object.keys(existing.journey_progress).length > 0) {
        // Cloud data exists — compare total stars, keep the one with more progress
        const cloudProgress = existing.journey_progress as JourneyProgressData;
        const cloudStars = cloudProgress.totalStars ?? 0;
        const localStars = localProgress?.totalStars ?? 0;

        if (localStars > cloudStars && localProgress) {
          // Local has more progress — overwrite cloud
          await supabase.from('user_progress').upsert(
            {
              id: user.id,
              journey_progress: localProgress,
              settings: localSettings,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        }
        // Otherwise keep cloud data (it has more or equal progress)
      } else if (localProgress) {
        // No cloud data — upload local data
        await supabase.from('user_progress').upsert(
          {
            id: user.id,
            journey_progress: localProgress,
            settings: localSettings,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      }
    } catch (err) {
      console.warn('Migration failed:', err);
    }
  }, [user]);

  // On sign-in: migrate local data then pull cloud data
  useEffect(() => {
    if (!user || initialPullDone.current) return;
    initialPullDone.current = true;

    (async () => {
      await migrateLocalToCloud();
      const cloud = await pullFromCloud();

      // Apply cloud data to localStorage so the existing hooks pick it up
      if (cloud.journeyProgress && cloud.journeyProgress.version) {
        window.localStorage.setItem(
          'journey-progress',
          JSON.stringify(cloud.journeyProgress)
        );
        // Dispatch storage event so useLocalStorage hooks re-read
        window.dispatchEvent(new Event('cloud-sync'));
      }

      if (cloud.settings) {
        for (const [key, value] of Object.entries(cloud.settings)) {
          if (value !== undefined && value !== null) {
            window.localStorage.setItem(key, JSON.stringify(value));
          }
        }
        window.dispatchEvent(new Event('cloud-sync'));
      }
    })();
  }, [user, migrateLocalToCloud, pullFromCloud]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (progressTimer.current) clearTimeout(progressTimer.current);
      if (settingsTimer.current) clearTimeout(settingsTimer.current);
    };
  }, []);

  return (
    <SyncContext.Provider
      value={{
        ...syncState,
        pushProgress,
        pushSettings,
        pullFromCloud,
        migrateLocalToCloud,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within SyncProvider');
  return ctx;
}
