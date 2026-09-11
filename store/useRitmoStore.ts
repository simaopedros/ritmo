import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { FREE_LIMITS } from '@/constants/pricing';
import { dayjs, formatDateKey, monthKey, todayKey } from '@/lib/dates';

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
  archived?: boolean;
};

export type MoodEntry = {
  date: string;
  mood: 1 | 2 | 3 | 4 | 5;
  note: string;
};

type Completions = Record<string, string[]>; // date -> habitIds

type SoftFlags = {
  softPaywallAfterHabitFocus: boolean;
  softPaywallAfterReview: boolean;
  firstHabitCompleted: boolean;
  firstFocusCompleted: boolean;
  firstReviewCompleted: boolean;
};

type RitmoState = {
  hydrated: boolean;
  onboardingDone: boolean;
  habits: Habit[];
  completions: Completions;
  focusSessionsToday: number;
  focusSessionsDate: string;
  streak: number;
  lastStreakDate: string | null;
  streakFreezeAvailable: boolean;
  streakFreezeMonth: string | null;
  isPro: boolean;
  moodEntries: MoodEntry[];
  soft: SoftFlags;
  // actions
  setHydrated: (v: boolean) => void;
  completeOnboarding: (firstHabitName: string, emoji?: string) => void;
  addHabit: (name: string, emoji?: string) => { ok: true } | { ok: false; reason: 'limit' };
  toggleHabitCompletion: (habitId: string, date?: string) => void;
  canStartFocus: () => boolean;
  recordFocusComplete: () => void;
  resetFocusDayIfNeeded: () => void;
  addMoodEntry: (mood: 1 | 2 | 3 | 4 | 5, note: string) => void;
  setIsPro: (v: boolean) => void;
  markSoftPaywallSeen: (kind: 'habitFocus' | 'review') => void;
  useStreakFreeze: () => boolean;
  recomputeStreak: () => void;
  getTodayProgress: () => { done: number; total: number; pct: number };
  isHabitDoneToday: (habitId: string) => boolean;
  getWeeklyCompletionPct: () => number[];
  shouldShowSoftPaywall: () => 'habitFocus' | 'review' | null;
};

const DEMO_HABITS: Habit[] = [
  {
    id: 'demo-agua',
    name: 'Beber água',
    emoji: '💧',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-movimento',
    name: 'Mover o corpo',
    emoji: '🏃',
    createdAt: new Date().toISOString(),
  },
];

function uid(prefix = 'h') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function dayWasProductive(
  date: string,
  completions: Completions,
  moodEntries: MoodEntry[],
  habits: Habit[]
): boolean {
  const active = habits.filter((h) => !h.archived);
  if (active.length === 0) return false;
  const done = completions[date]?.length ?? 0;
  const reviewed = moodEntries.some((m) => m.date === date);
  // Streak day: completed at least one habit OR closed the day with review
  return done > 0 || reviewed;
}

export const useRitmoStore = create<RitmoState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      onboardingDone: false,
      habits: [],
      completions: {},
      focusSessionsToday: 0,
      focusSessionsDate: todayKey(),
      streak: 0,
      lastStreakDate: null,
      streakFreezeAvailable: false,
      streakFreezeMonth: null,
      isPro: false,
      moodEntries: [],
      soft: {
        softPaywallAfterHabitFocus: false,
        softPaywallAfterReview: false,
        firstHabitCompleted: false,
        firstFocusCompleted: false,
        firstReviewCompleted: false,
      },

      setHydrated: (v) => set({ hydrated: v }),

      completeOnboarding: (firstHabitName, emoji = '✨') => {
        const first: Habit = {
          id: uid('habit'),
          name: firstHabitName.trim() || 'Meu primeiro hábito',
          emoji,
          createdAt: new Date().toISOString(),
        };
        set({
          onboardingDone: true,
          habits: [first, ...DEMO_HABITS],
        });
      },

      addHabit: (name, emoji = '🎯') => {
        const { habits, isPro } = get();
        const active = habits.filter((h) => !h.archived);
        if (!isPro && active.length >= FREE_LIMITS.maxHabits) {
          return { ok: false as const, reason: 'limit' as const };
        }
        const habit: Habit = {
          id: uid('habit'),
          name: name.trim(),
          emoji,
          createdAt: new Date().toISOString(),
        };
        set({ habits: [...habits, habit] });
        return { ok: true as const };
      },

      toggleHabitCompletion: (habitId, date = todayKey()) => {
        const { completions, soft } = get();
        const list = completions[date] ? [...completions[date]] : [];
        const idx = list.indexOf(habitId);
        if (idx >= 0) {
          list.splice(idx, 1);
        } else {
          list.push(habitId);
        }
        const nextCompletions = { ...completions, [date]: list };
        const nextSoft = { ...soft };
        if (idx < 0 && !soft.firstHabitCompleted) {
          nextSoft.firstHabitCompleted = true;
        }
        set({ completions: nextCompletions, soft: nextSoft });
        get().recomputeStreak();
      },

      canStartFocus: () => {
        get().resetFocusDayIfNeeded();
        const { isPro, focusSessionsToday } = get();
        if (isPro) return true;
        return focusSessionsToday < FREE_LIMITS.maxFocusPerDay;
      },

      recordFocusComplete: () => {
        get().resetFocusDayIfNeeded();
        const { focusSessionsToday, soft } = get();
        const nextSoft = { ...soft, firstFocusCompleted: true };
        set({
          focusSessionsToday: focusSessionsToday + 1,
          soft: nextSoft,
        });
      },

      resetFocusDayIfNeeded: () => {
        const today = todayKey();
        const { focusSessionsDate } = get();
        if (focusSessionsDate !== today) {
          set({ focusSessionsToday: 0, focusSessionsDate: today });
        }
        // Refresh monthly streak freeze for Pro
        const { isPro, streakFreezeMonth, streakFreezeAvailable } = get();
        const mk = monthKey();
        if (isPro && streakFreezeMonth !== mk) {
          set({ streakFreezeAvailable: true, streakFreezeMonth: mk });
        } else if (!isPro && streakFreezeAvailable) {
          set({ streakFreezeAvailable: false });
        }
      },

      addMoodEntry: (mood, note) => {
        const date = todayKey();
        const { moodEntries, soft } = get();
        const filtered = moodEntries.filter((m) => m.date !== date);
        const nextSoft = {
          ...soft,
          firstReviewCompleted: true,
        };
        set({
          moodEntries: [...filtered, { date, mood, note }],
          soft: nextSoft,
        });
        get().recomputeStreak();
      },

      setIsPro: (v) => {
        const mk = monthKey();
        set({
          isPro: v,
          streakFreezeAvailable: v,
          streakFreezeMonth: v ? mk : null,
        });
      },

      markSoftPaywallSeen: (kind) => {
        const { soft } = get();
        if (kind === 'habitFocus') {
          set({ soft: { ...soft, softPaywallAfterHabitFocus: true } });
        } else {
          set({ soft: { ...soft, softPaywallAfterReview: true } });
        }
      },

      useStreakFreeze: () => {
        const { isPro, streakFreezeAvailable } = get();
        if (!isPro || !streakFreezeAvailable) return false;
        set({ streakFreezeAvailable: false });
        return true;
      },

      recomputeStreak: () => {
        const { completions, moodEntries, habits, lastStreakDate, streak, isPro, streakFreezeAvailable } =
          get();
        const today = todayKey();
        let count = 0;
        let cursor = dayjs();
        // Walk backwards while days are productive
        for (let i = 0; i < 400; i++) {
          const key = cursor.format('YYYY-MM-DD');
          const productive = dayWasProductive(key, completions, moodEntries, habits);
          if (productive) {
            count += 1;
            cursor = cursor.subtract(1, 'day');
            continue;
          }
          // Today not yet productive: don't break streak yet, skip today
          if (key === today && count === 0) {
            cursor = cursor.subtract(1, 'day');
            continue;
          }
          // Gap yesterday: optionally freeze
          if (i === 1 && isPro && streakFreezeAvailable && count > 0) {
            // freeze covers one missed day — continue counting behind it
            cursor = cursor.subtract(1, 'day');
            continue;
          }
          break;
        }
        set({
          streak: count,
          lastStreakDate: count > 0 ? today : lastStreakDate,
        });
        // silence unused
        void streak;
      },

      getTodayProgress: () => {
        const { habits, completions } = get();
        const active = habits.filter((h) => !h.archived);
        const total = active.length;
        const doneIds = new Set(completions[todayKey()] ?? []);
        const done = active.filter((h) => doneIds.has(h.id)).length;
        const pct = total === 0 ? 0 : Math.round((done / total) * 100);
        return { done, total, pct };
      },

      isHabitDoneToday: (habitId) => {
        const list = get().completions[todayKey()] ?? [];
        return list.includes(habitId);
      },

      getWeeklyCompletionPct: () => {
        const { habits, completions } = get();
        const active = habits.filter((h) => !h.archived);
        const total = active.length || 1;
        const start = dayjs().startOf('isoWeek');
        return Array.from({ length: 7 }, (_, i) => {
          const key = start.add(i, 'day').format('YYYY-MM-DD');
          const done = (completions[key] ?? []).filter((id) =>
            active.some((h) => h.id === id)
          ).length;
          return Math.round((done / total) * 100);
        });
      },

      shouldShowSoftPaywall: () => {
        const { isPro, soft } = get();
        if (isPro) return null;
        if (
          soft.firstHabitCompleted &&
          soft.firstFocusCompleted &&
          !soft.softPaywallAfterHabitFocus
        ) {
          return 'habitFocus';
        }
        if (soft.firstReviewCompleted && !soft.softPaywallAfterReview) {
          return 'review';
        }
        return null;
      },
    }),
    {
      name: 'ritmo-storage-v1',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        state?.resetFocusDayIfNeeded();
      },
      partialize: (s) => ({
        onboardingDone: s.onboardingDone,
        habits: s.habits,
        completions: s.completions,
        focusSessionsToday: s.focusSessionsToday,
        focusSessionsDate: s.focusSessionsDate,
        streak: s.streak,
        lastStreakDate: s.lastStreakDate,
        streakFreezeAvailable: s.streakFreezeAvailable,
        streakFreezeMonth: s.streakFreezeMonth,
        isPro: s.isPro,
        moodEntries: s.moodEntries,
        soft: s.soft,
      }),
    }
  )
);

export function formatDateKeyExport(d?: Date | string) {
  return formatDateKey(d);
}
