'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, SUPABASE_ENABLED } from '@/lib/supabase';
import {
  buildHabitTimeline,
  defaultTimelineRange,
  sessionDateFromCreatedAt,
  type HabitDayRow,
  type HabitTimelineDay,
} from '@/lib/habit-history';
import { localDateISO } from '@/lib/calendar-dates';
import type { HabitsToday, Profile } from '@/state/types';

function trainedOnDate(profile: Profile | null, date: string): boolean {
  return profile?.streak_last_date === date;
}

export function useHabitHistory(
  userId: string | undefined,
  profile: Profile | null,
  habitsToday: HabitsToday | null,
  dayCount = 84,
): { days: HabitTimelineDay[]; loading: boolean; refresh: () => void } {
  const [habitRows, setHabitRows] = useState<HabitDayRow[]>([]);
  const [sessionDates, setSessionDates] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  const dates = useMemo(() => defaultTimelineRange(dayCount), [dayCount]);
  const rangeStart = dates[0];
  const today = localDateISO();

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!userId || !SUPABASE_ENABLED || !rangeStart) {
      setHabitRows([]);
      setSessionDates(new Set());
      return;
    }

    let cancelled = false;
    setLoading(true);

    const startIso = `${rangeStart}T00:00:00.000Z`;

    void (async () => {
      const [habitsRes, sessionsRes] = await Promise.all([
        supabase
          .from('daily_habits')
          .select('date, no_sugar, protein_met, water_met, steps_met, creatine_met, sick')
          .eq('user_id', userId)
          .gte('date', rangeStart)
          .lte('date', today),
        supabase
          .from('sessions')
          .select('created_at')
          .eq('user_id', userId)
          .gte('created_at', startIso),
      ]);

      if (cancelled) return;

      if (habitsRes.error) console.error('[gymbros] habit history habits', habitsRes.error);
      if (sessionsRes.error) console.error('[gymbros] habit history sessions', sessionsRes.error);

      setHabitRows((habitsRes.data as HabitDayRow[]) ?? []);
      const trained = new Set<string>();
      for (const row of sessionsRes.data ?? []) {
        if (row.created_at) trained.add(sessionDateFromCreatedAt(row.created_at as string));
      }
      setSessionDates(trained);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, rangeStart, today, tick]);

  const days = useMemo(() => {
    const habits = habitsToday ?? {
      no_sugar: false,
      protein_met: false,
      protein_g: 0,
      water_met: false,
      steps_met: false,
      creatine_met: false,
      sick: false,
    };
    return buildHabitTimeline({
      dates,
      habitRows,
      sessionDates,
      todayOverride: {
        habits,
        trainedToday: trainedOnDate(profile, today),
      },
    });
  }, [dates, habitRows, sessionDates, habitsToday, profile, today]);

  return { days, loading, refresh };
}
