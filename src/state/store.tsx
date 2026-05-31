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
import type { Profile } from './types';
import { WRITABLE_PROFILE_COLUMNS } from './types';
import type { Direction, Mode } from '../content/types';
import type { ProgramStage } from '../content/workouts';
import { ironForSession, gritForSession } from '../engine/currency';
import { applyProgress, entryHitCeiling, climb, stepDown, declineLevelUp, type LevelUpPrompt } from '../engine/leveling';
import type { Feel, LoggedEntry, ProgressAnswer } from '../engine/types';

const STAGE_AFTER: Record<Exclude<ProgramStage, 'standard'>, ProgramStage> = {
  w1: 'w2',
  w2: 'w3',
  w3: 'standard',
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export interface CompleteSessionInput {
  mode: Mode;
  kind: 'full' | 'split';
  splitDirection?: Direction;
  entries: LoggedEntry[];
  feel: Feel;
  progress: ProgressAnswer;
}

export interface CompleteSessionResult {
  ironEarned: number;
  gritEarned: number;
  prompts: LevelUpPrompt[];
}

interface AppState {
  ready: boolean;
  user: User | null;
  profile: Profile | null;
  partner: Profile | null;
  lastSplitDirection?: Direction;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  createPair: () => Promise<string>;
  joinPair: (code: string) => Promise<{ error?: string }>;
  pressProMode: () => void;
  completeSession: (input: CompleteSessionInput) => Promise<CompleteSessionResult>;
  climbExercise: (exerciseId: string) => void;
  stepDownExercise: (exerciseId: string) => void;
  declineExercise: (exerciseId: string) => void;
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
  const [lastSplitDirection, setLastSplitDirection] = useState<Direction>();

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileRef = useRef<Profile | null>(null);
  profileRef.current = profile;

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
    if (data) setProfile(data as Profile);
  }, []);

  const loadPartner = useCallback(async (pairId: string, myId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('pair_id', pairId)
      .neq('user_id', myId);
    setPartner((data?.[0] as Profile) ?? null);
  }, []);

  const loadLastSplit = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('sessions')
      .select('split')
      .eq('user_id', uid)
      .not('split', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);
    const split = data?.[0]?.split as string | undefined;
    if (split && ['up', 'forward', 'down'].includes(split)) setLastSplitDirection(split as Direction);
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
    const { data: sub } = supabase.auth.onAuthStateChange((_e: string, session: Session | null) => {
      setUser(session?.user ?? null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  // Load profile when user changes
  useEffect(() => {
    if (!user) { setProfile(null); setPartner(null); return; }
    void loadProfile(user.id);
    void loadLastSplit(user.id);
  }, [user, loadProfile, loadLastSplit]);

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
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, profile?.pair_id, loadPartner]);

  // ─── Auth actions ────────────────────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
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

    const ironEarned = ironForSession(input.entries);
    const ceilingCount = input.entries.filter(entryHitCeiling).length;
    const gritEarned = gritForSession(ceilingCount);

    const { state: nextExerciseState, prompts } = applyProgress(p.exercise_state, input.entries, input.progress);

    let programStage = p.program_stage;
    if (input.mode === 'home' && programStage !== 'standard') {
      programStage = STAGE_AFTER[programStage];
    }

    const today = todayISO();
    const streakCount = p.streak_last_date === today ? p.streak_count : p.streak_count + 1;

    // Monthly rest-token refill (full rust logic arrives in Phase 3).
    const restMonth = monthKey();
    const restTokens = p.rest_tokens_month === restMonth ? p.rest_tokens : 3;

    patchProfile({
      iron: p.iron + ironEarned,
      grit: p.grit + gritEarned,
      exercise_state: nextExerciseState,
      program_stage: programStage,
      days_trained: p.days_trained + 1,
      streak_count: streakCount,
      streak_last_date: today,
      rest_tokens: restTokens,
      rest_tokens_month: restMonth,
    });

    if (SUPABASE_ENABLED) {
      const { error } = await supabase.from('sessions').insert({
        user_id: p.user_id,
        pair_id: p.pair_id,
        mode: input.mode,
        split: input.kind === 'split' ? (input.splitDirection ?? null) : null,
        entries: input.entries,
        feel: input.feel,
        progress_answer: input.progress,
        iron_earned: ironEarned,
        grit_earned: gritEarned,
        prs: [],
      });
      if (error) console.error('[gymbros] session insert failed', error);
    }

    if (input.kind === 'split' && input.splitDirection) setLastSplitDirection(input.splitDirection);
    await flushSave();

    return { ironEarned, gritEarned, prompts };
  }, [patchProfile, flushSave]);

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

  const value = useMemo<AppState>(() => ({
    ready,
    user,
    profile,
    partner,
    lastSplitDirection,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    createPair,
    joinPair,
    pressProMode,
    completeSession,
    climbExercise,
    stepDownExercise,
    declineExercise,
  }), [ready, user, profile, partner, lastSplitDirection, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, createPair, joinPair, pressProMode, completeSession, climbExercise, stepDownExercise, declineExercise]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
