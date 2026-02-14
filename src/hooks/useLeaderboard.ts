import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export type LeaderboardMode = 'journey' | 'campaign' | 'jeopardy' | 'around_the_world';
export type LeaderboardPeriod = 'all_time' | 'monthly';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  score: number;
  metadata: Record<string, unknown>;
  achieved_at: string;
}

export function useLeaderboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);

  const fetchLeaderboard = useCallback(
    async (mode: LeaderboardMode, period: LeaderboardPeriod = 'all_time') => {
      setLoading(true);
      try {
        let data: LeaderboardEntry[] | null = null;

        if (period === 'all_time') {
          const { data: result, error } = await supabase.rpc('get_leaderboard', {
            p_mode: mode,
            p_limit: 100,
          });
          if (error) throw error;
          data = result;
        } else {
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString()
            .split('T')[0];
          const { data: result, error } = await supabase.rpc('get_monthly_leaderboard', {
            p_mode: mode,
            p_month: monthStart,
            p_limit: 100,
          });
          if (error) throw error;
          data = result;
        }

        setEntries(data ?? []);

        // Get current user's rank
        if (user && period === 'all_time') {
          const { data: rankData } = await supabase.rpc('get_user_rank', {
            p_user_id: user.id,
            p_mode: mode,
          });
          setUserRank(rankData ?? null);
        } else {
          setUserRank(null);
        }
      } catch (err) {
        console.warn('Failed to fetch leaderboard:', err);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const submitScore = useCallback(
    async (
      mode: LeaderboardMode,
      score: number,
      metadata: Record<string, unknown> = {}
    ) => {
      if (!user) return;

      try {
        // Upsert all-time score (only if higher)
        const { data: existing } = await supabase
          .from('leaderboard_scores')
          .select('score')
          .eq('user_id', user.id)
          .eq('mode', mode)
          .maybeSingle();

        if (!existing || score > existing.score) {
          await supabase.from('leaderboard_scores').upsert(
            {
              user_id: user.id,
              mode,
              score,
              metadata,
              achieved_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,mode' }
          );
        }

        // Upsert monthly score (only if higher for this month)
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split('T')[0];

        const { data: existingMonthly } = await supabase
          .from('leaderboard_monthly')
          .select('score')
          .eq('user_id', user.id)
          .eq('mode', mode)
          .eq('month', monthStart)
          .maybeSingle();

        if (!existingMonthly || score > existingMonthly.score) {
          await supabase.from('leaderboard_monthly').upsert(
            {
              user_id: user.id,
              mode,
              score,
              metadata,
              achieved_at: new Date().toISOString(),
              month: monthStart,
            },
            { onConflict: 'user_id,mode,month' }
          );
        }
      } catch (err) {
        console.warn('Failed to submit score:', err);
      }
    },
    [user]
  );

  return {
    loading,
    entries,
    userRank,
    fetchLeaderboard,
    submitScore,
  };
}
