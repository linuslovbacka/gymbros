'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { RealtimePostgresChangesPayload, Session, User } from '@supabase/supabase-js';
import { supabase, SUPABASE_ENABLED } from '../lib/supabase';
import type { HabitsToday, Profile } from './types';
import { WRITABLE_PROFILE_COLUMNS } from './types';
import { proteinBaseFromWeightKg, proteinMetFromLogged, proteinTargetG } from '../content/diet';
import type { Mode, SplitDay } from '../content/types';
import { normalizeSplitDay } from '../content/workouts';
import type { ProgramStage } from '../content/workouts';
import { ironForSession, gritForSession } from '../engine/currency';
import { applyProgress, entryHitCeiling, climb, stepDown, declineLevelUp, type LevelUpPrompt } from '../engine/leveling';
import type { Feel, LoggedEntry, ProgressAnswer } from '../engine/types';
import { detectPRs, type PR } from '../engine/pr';
import { evaluateAchievements, type AchievementUnlock, type SessionLite } from '../engine/achievements';
import { PR_GRIT } from '../content/achievements';
import { reconcileLapse, applySessionToRust } from '../engine/rust';
import { getCosmetic, cosmeticsForAchievement, type CosmeticSlot } from '../content/cosmetics';

const STAGE_AFTER: Record<Exclude<ProgramStage, 'standard'>, ProgramStage> = {
  w1: 'w2',
  w2: 'w3',
  w3: 'standard',
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface CompleteSessionInput {
  routine?: import('../content/routines').WorkoutRoutine;
  mode: Mode;
  kind: 'full' | 'split';
  splitDay?: SplitDay;
  entries: LoggedEntry[];
  feel: Feel;
  progress: ProgressAnswer;
}

export interface CompleteSessionResult {
  ironEarned: number;
  gritEarned: number;
  prompts: LevelUpPrompt[];
  prs: PR[];
  achievements: AchievementUnlock[];
}

const DAY_MS = 86_400_000;

interface AppState {
  ready: boolean;
  user: User | null;
  profile: Profile | null;
  partner: Profile | null;
  lastSplitDay?: SplitDay;
  habitsToday: HabitsToday | null;
  partnerHabitsToday: HabitsToday | null;
  passwordRecovery: boolean;
  toggleNoSugar: () => Promise<void>;
  toggleProteinMet: () => Promise<void>;
  addProteinGrams: (grams: number) => Promise<void>;
  resetProteinLog: () => Promise<void>;
  toggleWaterMet: () => Promise<void>;
  toggleStepsMet: () => Promise<void>;
  toggleSleepMet: () => Promise<void>;
  toggleCreatineMet: () => Promise<void>;
  toggleMobilityMet: () => Promise<void>;
  toggleSickDay: () => Promise<void>;
  setMaintenanceMode: (on: boolean) => void;
  skipBeginnerProgram: () => void;
  updateBodyMetrics: (input: { body_weight_kg: number; body_height_cm: number }) => void;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  resetPasswordForEmail: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  createPair: () => Promise<string>;
  joinPair: (code: string) => Promise<{ error?: string }>;
  pressProMode: () => void;
  completeSession: (input: CompleteSessionInput) => Promise<CompleteSessionResult>;
  climbExercise: (exerciseId: string) => void;
  stepDownExercise: (exerciseId: string) => void;
  declineExercise: (exerciseId: string) => void;
  buyCosmetic: (slug: string) => { error?: string };
  equipCosmetic: (slug: string) => void;
  unequipSlot: (slot: CosmeticSlot) => void;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [lastSplitDay, setLastSplitDay] = useState<SplitDay>();
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [habitsToday, setHabitsToday] = useState<HabitsToday | null>(null);
  const [partnerHabitsToday, setPartnerHabitsToday] = useState<HabitsToday | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileRef = useRef<Profile | null>(null);
  profileRef.current = profile;
  const partnerRef = useRef<Profile | null>(null);
  partnerRef.current = partner;

  // ─── Persistence ──────────────────────────────────────────────────────────
  const flushSave = useCallback(async () => {
    const p = profileRef.current;
    if (!SUPABASE_ENABLED || !p) return;
    const patch: Record<string, unknown> = { user_id: p.user_id };
    const row = p as unknown as Record<string, unknown>;
    for (const col of WRITABLE_PROFILE_COLUMNS) patch[col] = row[col];
    const { error } = await supabase.from('profiles').upsert(patch);
    if (error) console.error('[gymbros] profile save failed', error);
  }, []);

  const patchProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void flushSave(), 700);
  }, [flushSave]);

  // ─── Loading ────────────────────────────────────────────────────────────────
  const loadProfile = useCallback(async (uid: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', uid).maybeSingle();
    if (error) { console.error('[gymbros] loadProfile', error); return; }
    if (!data) return;

    // Reconcile any lapse since the last read (no server cron — see engine/rust).
    const profile = data as Profile;
    const r = reconcileLapse(profile, new Date());
    const reconciled: Profile = r.changed
      ? { ...profile, rust_state: r.rustState, rest_tokens: r.restTokens, rest_tokens_month: r.restTokensMonth }
      : profile;
    setProfile(reconciled);
    if (r.changed) {
      await supabase
        .from('profiles')
        .update({ rust_state: r.rustState, rest_tokens: r.restTokens, rest_tokens_month: r.restTokensMonth })
        .eq('user_id', uid);
    }
  }, []);

  const loadPartner = useCallback(async (pairId: string, myId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('pair_id', pairId)
      .neq('user_id', myId);
    setPartner((data?.[0] as Profile) ?? null);
  }, []);

  const loadHabitsForUser = useCallback(async (uid: string): Promise<HabitsToday> => {
    const date = todayISO();
    const { data, error } = await supabase
      .from('daily_habits')
      .select('no_sugar, protein_met, protein_g, water_met, steps_met, sleep_met, creatine_met, mobility_met, sick')
      .eq('user_id', uid)
      .eq('date', date)
      .maybeSingle();
    if (error) {
      console.error('[gymbros] loadHabits', error);
      return {
        no_sugar: false,
        protein_met: false,
        protein_g: 0,
        water_met: false,
        steps_met: false,
        sleep_met: false,
        creatine_met: false,
        mobility_met: false,
        sick: false,
      };
    }
    return {
      no_sugar: data?.no_sugar ?? false,
      protein_met: data?.protein_met ?? false,
      protein_g: data?.protein_g ?? 0,
      water_met: data?.water_met ?? false,
      steps_met: data?.steps_met ?? false,
      sleep_met: data?.sleep_met ?? false,
      creatine_met: data?.creatine_met ?? false,
      mobility_met: data?.mobility_met ?? false,
      sick: data?.sick ?? false,
    };
  }, []);

  const upsertHabits = useCallback(async (patch: Partial<HabitsToday>) => {
    const uid = user?.id;
    if (!uid || !SUPABASE_ENABLED) return;
    const date = todayISO();
    const next: HabitsToday = {
      no_sugar: patch.no_sugar ?? habitsToday?.no_sugar ?? false,
      protein_met: patch.protein_met ?? habitsToday?.protein_met ?? false,
      protein_g: patch.protein_g ?? habitsToday?.protein_g ?? 0,
      water_met: patch.water_met ?? habitsToday?.water_met ?? false,
      steps_met: patch.steps_met ?? habitsToday?.steps_met ?? false,
      sleep_met: patch.sleep_met ?? habitsToday?.sleep_met ?? false,
      creatine_met: patch.creatine_met ?? habitsToday?.creatine_met ?? false,
      mobility_met: patch.mobility_met ?? habitsToday?.mobility_met ?? false,
      sick: patch.sick ?? habitsToday?.sick ?? false,
    };
    setHabitsToday(next);
    const { error } = await supabase.from('daily_habits').upsert(
      { user_id: uid, date, ...next, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' },
    );
    if (error) console.error('[gymbros] upsert habits', error);
  }, [user, habitsToday]);

  const toggleNoSugar = useCallback(async () => {
    await upsertHabits({ no_sugar: !(habitsToday?.no_sugar ?? false) });
  }, [habitsToday, upsertHabits]);

  const toggleProteinMet = useCallback(async () => {
    await upsertHabits({ protein_met: !(habitsToday?.protein_met ?? false) });
  }, [habitsToday, upsertHabits]);

  const addProteinGrams = useCallback(
    async (grams: number) => {
      if (!Number.isFinite(grams) || grams <= 0) return;
      const target = proteinTargetG(profileRef.current);
      const nextG = Math.round((habitsToday?.protein_g ?? 0) + grams);
      await upsertHabits({
        protein_g: nextG,
        protein_met: proteinMetFromLogged(nextG, target),
      });
    },
    [habitsToday, upsertHabits],
  );

  const resetProteinLog = useCallback(async () => {
    await upsertHabits({ protein_g: 0, protein_met: false });
  }, [upsertHabits]);

  const toggleWaterMet = useCallback(async () => {
    await upsertHabits({ water_met: !(habitsToday?.water_met ?? false) });
  }, [habitsToday, upsertHabits]);

  const toggleStepsMet = useCallback(async () => {
    await upsertHabits({ steps_met: !(habitsToday?.steps_met ?? false) });
  }, [habitsToday, upsertHabits]);

  const toggleSleepMet = useCallback(async () => {
    await upsertHabits({ sleep_met: !(habitsToday?.sleep_met ?? false) });
  }, [habitsToday, upsertHabits]);

  const toggleCreatineMet = useCallback(async () => {
    await upsertHabits({ creatine_met: !(habitsToday?.creatine_met ?? false) });
  }, [habitsToday, upsertHabits]);

  const toggleMobilityMet = useCallback(async () => {
    await upsertHabits({ mobility_met: !(habitsToday?.mobility_met ?? false) });
  }, [habitsToday, upsertHabits]);

  const toggleSickDay = useCallback(async () => {
    await upsertHabits({ sick: !(habitsToday?.sick ?? false) });
  }, [habitsToday, upsertHabits]);

  const setMaintenanceMode = useCallback(
    (on: boolean) => {
      patchProfile({ maintenance_mode: on });
    },
    [patchProfile],
  );

  const skipBeginnerProgram = useCallback(() => {
    const p = profileRef.current;
    if (!p || p.program_stage === 'standard') return;
    patchProfile({ program_stage: 'standard' });
  }, [patchProfile]);

  const updateBodyMetrics = useCallback(
    (input: { body_weight_kg: number; body_height_cm: number }) => {
      const w = Math.round(input.body_weight_kg * 10) / 10;
      const h = Math.round(input.body_height_cm * 10) / 10;
      patchProfile({
        body_weight_kg: w,
        body_height_cm: h,
        protein_target_g: proteinBaseFromWeightKg(w),
      });
    },
    [patchProfile],
  );

  const loadLastSplit = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('sessions')
      .select('split')
      .eq('user_id', uid)
      .not('split', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);
    const split = data?.[0]?.split as string | undefined;
    const day = normalizeSplitDay(split);
    if (day) setLastSplitDay(day);
  }, []);

  // Auth bootstrap
  useEffect(() => {
    if (!SUPABASE_ENABLED) { setReady(true); return; }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  // Load profile when user changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setPartner(null);
      setHabitsToday(null);
      setPartnerHabitsToday(null);
      return;
    }
    void loadProfile(user.id);
    void loadLastSplit(user.id);
    void loadHabitsForUser(user.id).then(setHabitsToday);
  }, [user, loadProfile, loadLastSplit, loadHabitsForUser]);

  useEffect(() => {
    if (!partner?.user_id) {
      setPartnerHabitsToday(null);
      return;
    }
    void loadHabitsForUser(partner.user_id).then(setPartnerHabitsToday);
  }, [partner?.user_id, loadHabitsForUser]);

  // Load partner + realtime when pair changes
  useEffect(() => {
    if (!user || !profile?.pair_id) { setPartner(null); return; }
    const pairId = profile.pair_id;
    void loadPartner(pairId, user.id);
    const channel = supabase
      .channel(`pair-${pairId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `pair_id=eq.${pairId}` },
        (payload: RealtimePostgresChangesPayload<Profile>) => {
          const row = payload.new as Profile;
          if (row && row.user_id !== user.id) setPartner(row);
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_habits' },
        (payload) => {
          const row = payload.new as {
            user_id?: string;
            no_sugar?: boolean;
            protein_met?: boolean;
            protein_g?: number;
            water_met?: boolean;
            steps_met?: boolean;
            sleep_met?: boolean;
            creatine_met?: boolean;
            mobility_met?: boolean;
            sick?: boolean;
          };
          if (!row?.user_id || row.user_id === user.id) return;
          if (partnerRef.current?.user_id === row.user_id) {
            setPartnerHabitsToday({
              no_sugar: row.no_sugar ?? false,
              protein_met: row.protein_met ?? false,
              protein_g: row.protein_g ?? 0,
              water_met: row.water_met ?? false,
              steps_met: row.steps_met ?? false,
              sleep_met: row.sleep_met ?? false,
              creatine_met: row.creatine_met ?? false,
              mobility_met: row.mobility_met ?? false,
              sick: row.sick ?? false,
            });
          }
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, profile?.pair_id, loadPartner]);

  // ─── Auth actions ────────────────────────────────────────────────────────────
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message };
  }, []);

  const resetPasswordForEmail = useCallback(async (email: string) => {
    const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent('/update-password')}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: callback });
    return { error: error?.message };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
    setPasswordRecovery(false);
    return {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setPasswordRecovery(false);
    setProfile(null);
    setPartner(null);
  }, []);

  // ─── Pairing ──────────────────────────────────────────────────────────────────
  const createPair = useCallback(async () => {
    const { data, error } = await supabase.rpc('create_pair');
    if (error) throw error;
    if (user) await loadProfile(user.id);
    return data as string;
  }, [user, loadProfile]);

  const joinPair = useCallback(async (code: string) => {
    const { error } = await supabase.rpc('join_pair', { p_code: code.trim() });
    if (error) return { error: error.message };
    if (user) await loadProfile(user.id);
    return {};
  }, [user, loadProfile]);

  // ─── Pro Mode (irreversible escalation, spec section 7) ─────────────────────────
  const pressProMode = useCallback(() => {
    const p = profileRef.current;
    if (!p) return;
    patchProfile({ pro_mode_level: p.pro_mode_level + 1 });
  }, [patchProfile]);

  // ─── Session completion ─────────────────────────────────────────────────────────
  const completeSession = useCallback(async (input: CompleteSessionInput): Promise<CompleteSessionResult> => {
    const p = profileRef.current;
    if (!p) throw new Error('no profile');

    const isMobility = input.routine === 'mobility';

    const ironEarned = ironForSession(input.entries);
    const ceilingCount = input.entries.filter(entryHitCeiling).length;
    const baseGrit = gritForSession(ceilingCount);

    let nextExerciseState = p.exercise_state;
    let prompts: LevelUpPrompt[] = [];
    let prs: PR[] = [];
    if (!isMobility) {
      const { state: afterPR, prs: detected } = detectPRs(p.exercise_state, input.entries);
      const applied = applyProgress(afterPR, input.entries, input.progress);
      nextExerciseState = applied.state;
      prompts = applied.prompts;
      prs = detected;
    }
    const prCount = p.pr_count + prs.length;

    let programStage = p.program_stage;
    if (!isMobility && input.routine === 'main' && programStage !== 'standard') {
      programStage = STAGE_AFTER[programStage as Exclude<ProgramStage, 'standard'>];
    }

    const today = todayISO();
    const now = new Date();
    let streakCount = p.streak_count;
    let streakLastDate = p.streak_last_date;
    let restMonth = p.rest_tokens_month;
    let restTokens = p.rest_tokens;
    let rustState = p.rust_state;
    let justReturned = false;
    let deRusted = false;
    if (!isMobility) {
      const before = reconcileLapse(p, now);
      const rec = applySessionToRust(
        before.rustState,
        { streakCount: p.streak_count, streakLastDate: p.streak_last_date, today },
        now,
      );
      streakCount = rec.streakCount;
      streakLastDate = today;
      restMonth = rec.restTokensMonth;
      restTokens = rec.restTokens;
      rustState = rec.rustState;
      justReturned = rec.justReturned;
      deRusted = rec.deRusted;
    }

    // Achievement evaluation needs recent history (week/month windows). Pull the
    // last 31 days and prepend the session we're about to log.
    const sessionLite: SessionLite = { created_at: new Date().toISOString(), entries: input.entries };
    let recentSessions: SessionLite[] = [sessionLite];
    if (SUPABASE_ENABLED) {
      const since = new Date(Date.now() - 31 * DAY_MS).toISOString();
      const { data } = await supabase
        .from('sessions')
        .select('created_at, entries')
        .eq('user_id', p.user_id)
        .gte('created_at', since)
        .order('created_at', { ascending: false });
      recentSessions = [sessionLite, ...((data as SessionLite[]) ?? [])];
    }

    // ── Bro / social signals (spec section 11) ───────────────────────────────
    const partner = partnerRef.current;
    const weekAgo = new Date(Date.now() - 7 * DAY_MS).toISOString();
    const myWeekIron = recentSessions
      .filter((s) => s.created_at >= weekAgo)
      .reduce((sum, s) => sum + ironForSession(s.entries ?? []), 0);
    let combinedWeekIron = myWeekIron;
    let partnerTrainedToday = false;
    let bothStreak14 = false;
    if (partner) {
      partnerTrainedToday = partner.streak_last_date === today;
      bothStreak14 = streakCount >= 14 && partner.streak_count >= 14;
      if (SUPABASE_ENABLED) {
        const { data: pData } = await supabase
          .from('sessions')
          .select('iron_earned')
          .eq('user_id', partner.user_id)
          .gte('created_at', weekAgo);
        const partnerWeekIron = (pData ?? []).reduce(
          (s: number, r: { iron_earned?: number }) => s + (r.iron_earned ?? 0),
          0,
        );
        combinedWeekIron += partnerWeekIron;
      }
    }

    // Strength signals: heaviest working weight (gym weights only climb, so the
    // current per-exercise weight is the max) and lifetime IRON output.
    const stateWeights = Object.values(nextExerciseState).map((e) => e.weightKg ?? 0);
    const entryWeights = input.entries.map((e) => e.weightKg ?? 0);
    const maxWeightKg = Math.max(0, ...stateWeights, ...entryWeights);
    const ironLifetime = (p.iron_lifetime ?? 0) + ironEarned;

    const accountAgeDays = Math.floor((Date.now() - new Date(p.created_at).getTime()) / DAY_MS);
    const alreadyUnlocked = new Set((p.unlocked_achievements as string[]) ?? []);
    const { unlocked, gritAward, ironAward } = evaluateAchievements({
      streak: streakCount,
      prCount,
      distinctExercises: Object.keys(nextExerciseState).length,
      accountAgeDays,
      alreadyUnlocked,
      recentSessions,
      justReturned,
      deRusted,
      comebackCount: rustState.comebackCount,
      partnerTrainedToday,
      bothStreak14,
      combinedWeekIron,
      maxWeightKg,
      ironLifetime,
    });

    const prGrit = prs.length * PR_GRIT;
    const gritEarned = baseGrit + prGrit + gritAward;
    const ironTotal = ironEarned + ironAward;
    const unlockedAchievements = [...((p.unlocked_achievements as string[]) ?? []), ...unlocked.map((u) => u.id)];

    // Grant any cosmetics tied to the achievements unlocked this session.
    const grantedSlugs = unlocked.flatMap((u) => cosmeticsForAchievement(u.id).map((c) => c.slug));
    const ownedCosmetics = Array.from(new Set([...(p.owned_cosmetics ?? []), ...grantedSlugs]));

    patchProfile({
      iron: p.iron + ironTotal,
      iron_lifetime: ironLifetime,
      grit: p.grit + gritEarned,
      exercise_state: nextExerciseState,
      program_stage: programStage,
      days_trained: isMobility ? p.days_trained : p.days_trained + 1,
      pr_count: prCount,
      unlocked_achievements: unlockedAchievements,
      owned_cosmetics: ownedCosmetics,
      streak_count: streakCount,
      streak_last_date: isMobility ? p.streak_last_date : streakLastDate,
      rest_tokens: restTokens,
      rest_tokens_month: restMonth,
      rust_state: rustState,
    });

    if (SUPABASE_ENABLED) {
      const { error } = await supabase.from('sessions').insert({
        user_id: p.user_id,
        pair_id: p.pair_id,
        mode: input.mode,
        split: input.kind === 'split' ? (input.splitDay ?? null) : null,
        entries: input.entries,
        feel: input.feel,
        progress_answer: input.progress,
        iron_earned: ironTotal,
        grit_earned: gritEarned,
        prs,
      });
      if (error) console.error('[gymbros] session insert failed', error);
    }

    if (
      (input.routine === 'main' || !input.routine) &&
      input.kind === 'split' &&
      input.splitDay
    ) {
      setLastSplitDay(input.splitDay);
    }
    if (isMobility) {
      await upsertHabits({ mobility_met: true });
    }
    await flushSave();

    return { ironEarned: ironTotal, gritEarned, prompts, prs, achievements: unlocked };
  }, [patchProfile, flushSave, upsertHabits]);

  const climbExercise = useCallback((id: string) => {
    const p = profileRef.current; if (!p) return;
    patchProfile({ exercise_state: climb(p.exercise_state, id) });
  }, [patchProfile]);

  const stepDownExercise = useCallback((id: string) => {
    const p = profileRef.current; if (!p) return;
    patchProfile({ exercise_state: stepDown(p.exercise_state, id) });
  }, [patchProfile]);

  const declineExercise = useCallback((id: string) => {
    const p = profileRef.current; if (!p) return;
    patchProfile({ exercise_state: declineLevelUp(p.exercise_state, id) });
  }, [patchProfile]);

  // ─── Cosmetics (spec section 8) ─────────────────────────────────────────────────
  const buyCosmetic = useCallback((slug: string): { error?: string } => {
    const p = profileRef.current; if (!p) return { error: 'no profile' };
    const c = getCosmetic(slug);
    if (!c) return { error: 'unknown item' };
    if ((p.owned_cosmetics ?? []).includes(slug)) return { error: 'already owned' };
    if (c.acquire.type !== 'shop') return { error: 'not for sale' };
    const { currency, price } = c.acquire;
    const balance = currency === 'IRON' ? p.iron : p.grit;
    if (balance < price) return { error: `not enough ${currency}` };

    patchProfile({
      iron: currency === 'IRON' ? p.iron - price : p.iron,
      grit: currency === 'GRIT' ? p.grit - price : p.grit,
      owned_cosmetics: [...(p.owned_cosmetics ?? []), slug],
    });
    return {};
  }, [patchProfile]);

  const equipCosmetic = useCallback((slug: string) => {
    const p = profileRef.current; if (!p) return;
    const c = getCosmetic(slug);
    if (!c || !(p.owned_cosmetics ?? []).includes(slug)) return;
    patchProfile({ equipped: { ...(p.equipped ?? {}), [c.slot]: slug } });
  }, [patchProfile]);

  const unequipSlot = useCallback((slot: CosmeticSlot) => {
    const p = profileRef.current; if (!p) return;
    patchProfile({ equipped: { ...(p.equipped ?? {}), [slot]: null } });
  }, [patchProfile]);

  const value = useMemo<AppState>(() => ({
    ready,
    user,
    profile,
    partner,
    lastSplitDay,
    habitsToday,
    partnerHabitsToday,
    passwordRecovery,
    toggleNoSugar,
    toggleProteinMet,
    addProteinGrams,
    resetProteinLog,
    toggleWaterMet,
    toggleStepsMet,
    toggleSleepMet,
    toggleCreatineMet,
    toggleMobilityMet,
    toggleSickDay,
    setMaintenanceMode,
    skipBeginnerProgram,
    updateBodyMetrics,
    signInWithEmail,
    signUpWithEmail,
    resetPasswordForEmail,
    updatePassword,
    signOut,
    createPair,
    joinPair,
    pressProMode,
    completeSession,
    climbExercise,
    stepDownExercise,
    declineExercise,
    buyCosmetic,
    equipCosmetic,
    unequipSlot,
  }), [ready, user, profile, partner, lastSplitDay, habitsToday, partnerHabitsToday, passwordRecovery, toggleNoSugar, toggleProteinMet, addProteinGrams, resetProteinLog, toggleWaterMet, toggleStepsMet, toggleSleepMet, toggleCreatineMet, toggleMobilityMet, toggleSickDay, setMaintenanceMode, skipBeginnerProgram, updateBodyMetrics, signInWithEmail, signUpWithEmail, resetPasswordForEmail, updatePassword, signOut, createPair, joinPair, pressProMode, completeSession, climbExercise, stepDownExercise, declineExercise, buyCosmetic, equipCosmetic, unequipSlot]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
