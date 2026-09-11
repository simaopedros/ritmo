/**
 * Reminder scheduling for Ritmo.
 *
 * Uses expo-notifications when available (native iOS/Android builds / Expo Go).
 * On web and unsupported environments we degrade gracefully: the UI still
 * stores reminder prefs and this module no-ops schedule/cancel with clear
 * `supported: false` so callers can show a soft message.
 */
import { Platform } from 'react-native';

export type ReminderKind = 'closeDay' | 'habit';

export type ScheduledReminder = {
  id: string;
  kind: ReminderKind;
  habitId?: string;
  hour: number;
  minute: number;
  title: string;
  body: string;
};

type NotifModule = typeof import('expo-notifications');

let Notifications: NotifModule | null = null;
let loadAttempted = false;

async function loadModule(): Promise<NotifModule | null> {
  if (loadAttempted) return Notifications;
  loadAttempted = true;
  // Web / SSR: expo-notifications often lacks full scheduling support.
  if (Platform.OS === 'web') {
    Notifications = null;
    return null;
  }
  try {
    Notifications = await import('expo-notifications');
    // Show alerts when app is foregrounded (native only).
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    return Notifications;
  } catch {
    // Package missing or native module unavailable (e.g. some Expo web/dev shells).
    Notifications = null;
    return null;
  }
}

export function areNotificationsSupported(): boolean {
  return Platform.OS !== 'web';
}

export async function getNotificationPermission(): Promise<
  'granted' | 'denied' | 'undetermined' | 'unsupported'
> {
  if (!areNotificationsSupported()) return 'unsupported';
  const mod = await loadModule();
  if (!mod) return 'unsupported';
  try {
    const { status } = await mod.getPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'unsupported';
  }
}

export async function requestNotificationPermission(): Promise<
  'granted' | 'denied' | 'unsupported'
> {
  if (!areNotificationsSupported()) return 'unsupported';
  const mod = await loadModule();
  if (!mod) return 'unsupported';
  try {
    const { status } = await mod.requestPermissionsAsync();
    return status === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'unsupported';
  }
}

function parseTime(hhmm: string): { hour: number; minute: number } {
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  return {
    hour: Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 20,
    minute: Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 0,
  };
}

/** Cancel all Ritmo-scheduled reminders, then reschedule the given list. */
export async function syncReminders(
  reminders: ScheduledReminder[]
): Promise<{ ok: boolean; supported: boolean; error?: string }> {
  const mod = await loadModule();
  if (!mod) {
    return { ok: true, supported: false };
  }
  try {
    await mod.cancelAllScheduledNotificationsAsync();
    for (const r of reminders) {
      const { hour, minute } = { hour: r.hour, minute: r.minute };
      await mod.scheduleNotificationAsync({
        identifier: r.id,
        content: {
          title: r.title,
          body: r.body,
          sound: true,
        },
        trigger: {
          type: mod.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    }
    return { ok: true, supported: true };
  } catch (e) {
    return {
      ok: false,
      supported: true,
      error: e instanceof Error ? e.message : 'Falha ao agendar',
    };
  }
}

export function buildReminderList(input: {
  closeDayEnabled: boolean;
  closeDayTime: string;
  habits: { id: string; name: string; emoji: string; reminderTime?: string | null }[];
}): ScheduledReminder[] {
  const list: ScheduledReminder[] = [];
  if (input.closeDayEnabled) {
    const t = parseTime(input.closeDayTime || '20:00');
    list.push({
      id: 'ritmo-close-day',
      kind: 'closeDay',
      hour: t.hour,
      minute: t.minute,
      title: 'Fechar o dia',
      body: 'Hora da review — humor + nota para proteger seu streak.',
    });
  }
  for (const h of input.habits) {
    if (!h.reminderTime) continue;
    const t = parseTime(h.reminderTime);
    list.push({
      id: `ritmo-habit-${h.id}`,
      kind: 'habit',
      habitId: h.id,
      hour: t.hour,
      minute: t.minute,
      title: `${h.emoji} ${h.name}`,
      body: 'Lembrete do Ritmo — marque quando concluir.',
    });
  }
  return list;
}

export { parseTime };
