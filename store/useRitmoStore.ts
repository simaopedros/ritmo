import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { FREE_LIMITS } from '@/constants/pricing';
import { dayjs, formatDateKey, monthKey, todayKey } from '@/lib/dates';
import {
  buildReminderList,
  syncReminders,
} from '@/lib/notifications';

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
  archived?: boolean;
  /** Optional daily reminder "HH:mm" */
  reminderTime?: string | null;
};

export type MoodEntry = {
  date: string;
  mood: 1 | 2 | 3 | 4 | 5;
  note: string;
};

type Completions = Record<string, string[]>; // date -> habitIds
/** date -> focus minutes completed that day */
type FocusMinutesByDate = Record<string, number>;

type SoftFlags = {
  softPaywallAfterHabitFocus: boolean;
  softPaywallAfterReview: boolean;
  firstHabitCompleted: boolean;
  firstFocusCompleted: boolean;
  firstReviewCompleted: boolean;
};

export type CloseDayReminder = {
  enabled: boolean;
  time: string; // HH:mm
};

type RitmoState = {
  hydrated: boolean;
  onboardingDone: boolean;
  habits: Habit[];
  completions: Completions;
  focusSessionsToday: number;
  focusSessionsDate: string;
  focusMinutesByDate: FocusMinutesByDate;
  streak: number;
  lastStreakDate: string | null;
  streakFreezeAvailable: boolean;
  streakFreezeMonth: string | null;
  /** Dates covered by an explicit streak freeze */
  frozenDates: string[];
  isPro: boolean;
  moodEntries: MoodEntry[];
  soft: SoftFlags;
  closeDayReminder: CloseDayReminder;
  notificationsGranted: boolean;
  // actions
  setHydrated: (v: boolean) => void;
  completeOnboarding: (firstHabitName: string, emoji?: string) => void;
  addHabit: (
    name: string,
    emoji?: string,
    reminderTime?: string | null
  ) => { ok: true } | { ok: false; reason: 'limit' | 'reminder_limit' };
  updateHabitReminder: (
    habitId: string,
    reminderTime: string | null
  ) => { ok: true } | { ok: false; reason: 'reminder_limit' };
  setCloseDayReminder: (
    enabled: boolean,
    time?: string
  ) => { ok: true } | { ok: false; reason: 'reminder_limit' };
  setNotificationsGranted: (v: boolean) => void;
  resyncReminders: () => Promise<void>;
  toggleHabitCompletion: (habitId: string, date?: string) => void;
  canStartFocus: () => boolean;
  recordFocusComplete: (minutes?: number) => void;
  resetFocusDayIfNeeded: () => void;
  addMoodEntry: (mood: 1 | 2 | 3 | 4 | 5, note: string) => void;
  setIsPro: (v: boolean) => void;
  markSoftPaywallSeen: (kind: 'habitFocus' | 'review') => void;
  useStreakFreeze: (date?: string) => boolean;
  /** True when Pro has a freeze available and yesterday would break the streak */
  shouldOfferStreakFreeze: () => boolean;
  getFreezeGapDate: () => string | null;
  countActiveReminders: () => number;
  canAddReminder: () => boolean;
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

const DEFAULT_CLOSE_DAY: CloseDayReminder = {
  enabled: false,
  time: '20:00',
};

const FOCUS_SESSION_MINUTES = 25;

function uid(prefix = 'h') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function dayWasProductive(
  date: string,
  completions: Completions,
  moodEntries: MoodEntry[],
  habits: Habit[],
  frozenDates: string[]
): boolean {
  if (frozenDates.includes(date)) return true;
  const active = habits.filter((h) => !h.archived);
  if (active.length === 0) return false;
  const done = completions[date]?.length ?? 0;
  const reviewed = moodEntries.some((m) => m.date === date);
  // Streak day: completed at least one habit OR closed the day with review
  return done > 0 || reviewed;
}

function countReminders(
  habits: Habit[],
  closeDay: CloseDayReminder
): number {
  const habitRem = habits.filter((h) => !h.archived && h.reminderTime).length;
  return habitRem + (closeDay.enabled ? 1 : 0);
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
      focusMinutesByDate: {},
      streak: 0,
      lastStreakDate: null,
      streakFreezeAvailable: false,
      streakFreezeMonth: null,
      frozenDates: [],
      isPro: false,
      moodEntries: [],
      soft: {
        softPaywallAfterHabitFocus: false,
        softPaywallAfterReview: false,
        firstHabitCompleted: false,
        firstFocusCompleted: false,
        firstReviewCompleted: false,
      },
      closeDayReminder: { ...DEFAULT_CLOSE_DAY },
      notificationsGranted: false,

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

      addHabit: (name, emoji = '🎯', reminderTime = null) => {
        const { habits, isPro, closeDayReminder } = get();
        const active = habits.filter((h) => !h.archived);
        if (!isPro && active.length >= FREE_LIMITS.maxHabits) {
          return { ok: false as const, reason: 'limit' as const };
        }
        if (reminderTime) {
          const nextCount =
            countReminders(habits, closeDayReminder) + 1;
          if (!isPro && nextCount > FREE_LIMITS.maxReminders) {
            return { ok: false as const, reason: 'reminder_limit' as const };
          }
        }
        const habit: Habit = {
          id: uid('habit'),
          name: name.trim(),
          emoji,
          createdAt: new Date().toISOString(),
          reminderTime: reminderTime || null,
        };
        set({ habits: [...habits, habit] });
        void get().resyncReminders();
        return { ok: true as const };
      },

      updateHabitReminder: (habitId, reminderTime) => {
        const { habits, isPro, closeDayReminder } = get();
        const current = habits.find((h) => h.id === habitId);
        if (!current) return { ok: true as const };

        const enabling = !!reminderTime && !current.reminderTime;
        if (enabling) {
          const nextCount = countReminders(habits, closeDayReminder) + 1;
          if (!isPro && nextCount > FREE_LIMITS.maxReminders) {
            return { ok: false as const, reason: 'reminder_limit' as const };
          }
        }

        set({
          habits: habits.map((h) =>
            h.id === habitId ? { ...h, reminderTime: reminderTime || null } : h
          ),
        });
        void get().resyncReminders();
        return { ok: true as const };
      },

      setCloseDayReminder: (enabled, time) => {
        const { habits, isPro, closeDayReminder } = get();
        const next: CloseDayReminder = {
          enabled,
          time: time ?? closeDayReminder.time,
        };
        if (enabled && !closeDayReminder.enabled) {
          const withoutClose = {
            ...closeDayReminder,
            enabled: false,
          };
          const nextCount = countReminders(habits, withoutClose) + 1;
          if (!isPro && nextCount > FREE_LIMITS.maxReminders) {
            return { ok: false as const, reason: 'reminder_limit' as const };
          }
        }
        set({ closeDayReminder: next });
        void get().resyncReminders();
        return { ok: true as const };
      },

      setNotificationsGranted: (v) => set({ notificationsGranted: v }),

      resyncReminders: async () => {
        const { habits, closeDayReminder } = get();
        const list = buildReminderList({
          closeDayEnabled: closeDayReminder.enabled,
          closeDayTime: closeDayReminder.time,
          habits: habits.filter((h) => !h.archived),
        });
        await syncReminders(list);
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

      recordFocusComplete: (minutes = FOCUS_SESSION_MINUTES) => {
        get().resetFocusDayIfNeeded();
        const { focusSessionsToday, soft, focusMinutesByDate } = get();
        const today = todayKey();
        const nextSoft = { ...soft, firstFocusCompleted: true };
        set({
          focusSessionsToday: focusSessionsToday + 1,
          soft: nextSoft,
          focusMinutesByDate: {
            ...focusMinutesByDate,
            [today]: (focusMinutesByDate[today] ?? 0) + minutes,
          },
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
        // Free downgrade: keep at most 1 reminder
        if (!v) {
          const { habits, closeDayReminder } = get();
          let remaining = FREE_LIMITS.maxReminders;
          let nextClose = { ...closeDayReminder };
          let nextHabits = habits.map((h) => ({ ...h }));
          if (nextClose.enabled) {
            if (remaining > 0) remaining -= 1;
            else nextClose = { ...nextClose, enabled: false };
          }
          nextHabits = nextHabits.map((h) => {
            if (!h.reminderTime) return h;
            if (remaining > 0) {
              remaining -= 1;
              return h;
            }
            return { ...h, reminderTime: null };
          });
          set({ habits: nextHabits, closeDayReminder: nextClose });
          void get().resyncReminders();
        }
      },

      markSoftPaywallSeen: (kind) => {
        const { soft } = get();
        if (kind === 'habitFocus') {
          set({ soft: { ...soft, softPaywallAfterHabitFocus: true } });
        } else {
          set({ soft: { ...soft, softPaywallAfterReview: true } });
        }
      },

      getFreezeGapDate: () => {
        const { completions, moodEntries, habits, frozenDates } = get();
        const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
        if (
          dayWasProductive(
            yesterday,
            completions,
            moodEntries,
            habits,
            frozenDates
          )
        ) {
          return null;
        }
        // Need prior productive days behind the gap (streak that would break)
        for (let i = 2; i <= 45; i++) {
          const key = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
          if (
            dayWasProductive(key, completions, moodEntries, habits, frozenDates)
          ) {
            return yesterday;
          }
        }
        return null;
      },

      shouldOfferStreakFreeze: () => {
        const { isPro, streakFreezeAvailable } = get();
        if (!isPro || !streakFreezeAvailable) return false;
        return get().getFreezeGapDate() !== null;
      },

      useStreakFreeze: (date) => {
        const { isPro, streakFreezeAvailable, frozenDates } = get();
        if (!isPro || !streakFreezeAvailable) return false;
        const gap = date ?? get().getFreezeGapDate();
        if (!gap) return false;
        if (frozenDates.includes(gap)) {
          set({ streakFreezeAvailable: false });
          get().recomputeStreak();
          return true;
        }
        set({
          streakFreezeAvailable: false,
          frozenDates: [...frozenDates, gap],
        });
        get().recomputeStreak();
        return true;
      },

      countActiveReminders: () => {
        const { habits, closeDayReminder } = get();
        return countReminders(habits, closeDayReminder);
      },

      canAddReminder: () => {
        const { isPro } = get();
        if (isPro) return true;
        return get().countActiveReminders() < FREE_LIMITS.maxReminders;
      },

      recomputeStreak: () => {
        const {
          completions,
          moodEntries,
          habits,
          lastStreakDate,
          frozenDates,
        } = get();
        const today = todayKey();
        let count = 0;
        let cursor = dayjs();
        // Walk backwards while days are productive (freeze dates count)
        for (let i = 0; i < 400; i++) {
          const key = cursor.format('YYYY-MM-DD');
          const productive = dayWasProductive(
            key,
            completions,
            moodEntries,
            habits,
            frozenDates
          );
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
          break;
        }
        set({
          streak: count,
          lastStreakDate: count > 0 ? today : lastStreakDate,
        });
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
        state?.recomputeStreak();
      },
      partialize: (s) => ({
        onboardingDone: s.onboardingDone,
        habits: s.habits,
        completions: s.completions,
        focusSessionsToday: s.focusSessionsToday,
        focusSessionsDate: s.focusSessionsDate,
        focusMinutesByDate: s.focusMinutesByDate,
        streak: s.streak,
        lastStreakDate: s.lastStreakDate,
        streakFreezeAvailable: s.streakFreezeAvailable,
        streakFreezeMonth: s.streakFreezeMonth,
        frozenDates: s.frozenDates,
        isPro: s.isPro,
        moodEntries: s.moodEntries,
        soft: s.soft,
        closeDayReminder: s.closeDayReminder,
        notificationsGranted: s.notificationsGranted,
      }),
    }
  )
);

export function formatDateKeyExport(d?: Date | string) {
  return formatDateKey(d);
}
