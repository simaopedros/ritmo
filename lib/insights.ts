import { dayjs, weekDayLabels } from '@/lib/dates';
import type { Habit, MoodEntry } from '@/store/useRitmoStore';

export type Insight = {
  id: string;
  title: string;
  action: string;
};

type Completions = Record<string, string[]>;
type FocusMinutesByDate = Record<string, number>;

const WEEKDAY_FULL = [
  'segunda',
  'terça',
  'quarta',
  'quinta',
  'sexta',
  'sábado',
  'domingo',
] as const;

function weekKeys(offsetWeeks = 0): string[] {
  const start = dayjs().startOf('isoWeek').subtract(offsetWeeks, 'week');
  return Array.from({ length: 7 }, (_, i) => start.add(i, 'day').format('YYYY-MM-DD'));
}

function activeHabits(habits: Habit[]) {
  return habits.filter((h) => !h.archived);
}

/** Deterministic weekly insights from local data (no LLM). */
export function computeWeeklyInsights(input: {
  habits: Habit[];
  completions: Completions;
  moodEntries: MoodEntry[];
  focusMinutesByDate: FocusMinutesByDate;
}): Insight[] {
  const { habits, completions, moodEntries, focusMinutesByDate } = input;
  const active = activeHabits(habits);
  const thisWeek = weekKeys(0);
  const lastWeek = weekKeys(1);
  const insights: Insight[] = [];
  const today = dayjs().format('YYYY-MM-DD');

  // 1) Best weekday (among days with data up to today)
  if (active.length > 0) {
    const rates = thisWeek.map((key, i) => {
      if (dayjs(key).isAfter(dayjs(today), 'day')) return { i, rate: -1, done: 0 };
      const done = (completions[key] ?? []).filter((id) =>
        active.some((h) => h.id === id)
      ).length;
      const rate = done / active.length;
      return { i, rate, done };
    });
    const scored = rates.filter((r) => r.rate >= 0);
    if (scored.length > 0) {
      const best = scored.reduce((a, b) => (b.rate > a.rate ? b : a));
      const worst = scored.reduce((a, b) => (b.rate < a.rate ? b : a));
      if (best.rate > 0) {
        const label = WEEKDAY_FULL[best.i];
        insights.push({
          id: 'best-day',
          title: `Melhor dia: ${label}`,
          action: `Na ${label} você completa mais — proteja esse bloco e replique o horário nos outros dias.`,
        });
      }
      if (worst.i !== best.i && worst.rate < best.rate && scored.length >= 3) {
        const wLabel = WEEKDAY_FULL[worst.i];
        insights.push({
          id: 'weak-day',
          title: `Dia frágil: ${wLabel}`,
          action: `Na ${wLabel} você falha mais — mova o horário ou corte um hábito nesse dia.`,
        });
      }
    }
  }

  // 2) Most skipped habit this week
  if (active.length > 0) {
    const daysElapsed = thisWeek.filter((k) => !dayjs(k).isAfter(dayjs(today), 'day')).length || 1;
    let worstHabit: Habit | null = null;
    let worstMisses = -1;
    for (const h of active) {
      let misses = 0;
      for (const key of thisWeek) {
        if (dayjs(key).isAfter(dayjs(today), 'day')) continue;
        if (!(completions[key] ?? []).includes(h.id)) misses += 1;
      }
      if (misses > worstMisses) {
        worstMisses = misses;
        worstHabit = h;
      }
    }
    if (worstHabit && worstMisses >= Math.ceil(daysElapsed * 0.4)) {
      insights.push({
        id: 'skipped-habit',
        title: `Mais pulado: ${worstHabit.emoji} ${worstHabit.name}`,
        action: `Você pulou “${worstHabit.name}” ${worstMisses}x esta semana — reduza o tamanho ou fixe um horário.`,
      });
    }
  }

  // 3) Focus minutes this week vs last
  const sumFocus = (keys: string[]) =>
    keys.reduce((acc, k) => acc + (focusMinutesByDate[k] ?? 0), 0);
  const focusThis = sumFocus(thisWeek);
  const focusLast = sumFocus(lastWeek);
  if (focusThis > 0 || focusLast > 0) {
    const delta = focusThis - focusLast;
    let action: string;
    if (focusLast === 0 && focusThis > 0) {
      action = `${focusThis} min de foco esta semana — mantenha ao menos uma sessão nos próximos dias.`;
    } else if (delta > 0) {
      action = `${focusThis} min vs ${focusLast} min na semana passada (+${delta}). Reserve o mesmo bloco amanhã.`;
    } else if (delta < 0) {
      action = `${focusThis} min vs ${focusLast} min na semana passada (${delta}). Bloqueie 25 min hoje para recuperar.`;
    } else {
      action = `${focusThis} min — estável vs semana passada. Experimente uma sessão a mais.`;
    }
    insights.push({
      id: 'focus-trend',
      title: `Foco: ${focusThis} min esta semana`,
      action,
    });
  }

  // 4) Mood vs completion correlation
  const pairs: { mood: number; pct: number }[] = [];
  for (const key of [...lastWeek, ...thisWeek]) {
    if (dayjs(key).isAfter(dayjs(today), 'day')) continue;
    const mood = moodEntries.find((m) => m.date === key);
    if (!mood || active.length === 0) continue;
    const done = (completions[key] ?? []).filter((id) =>
      active.some((h) => h.id === id)
    ).length;
    pairs.push({ mood: mood.mood, pct: done / active.length });
  }
  if (pairs.length >= 3) {
    const high = pairs.filter((p) => p.mood >= 4);
    const low = pairs.filter((p) => p.mood <= 2);
    const avg = (arr: { pct: number }[]) =>
      arr.length === 0 ? 0 : arr.reduce((a, b) => a + b.pct, 0) / arr.length;
    const highAvg = avg(high);
    const lowAvg = avg(low);
    if (high.length > 0 && low.length > 0 && highAvg - lowAvg >= 0.15) {
      insights.push({
        id: 'mood-corr',
        title: 'Humor sobe com hábitos',
        action:
          'Nos dias com humor alto você completa mais — priorize 1 hábito fácil quando o humor cair.',
      });
    } else if (high.length > 0 && low.length > 0 && lowAvg - highAvg >= 0.15) {
      insights.push({
        id: 'mood-corr-inv',
        title: 'Humor e hábitos desalinhados',
        action:
          'Humor baixo ainda assim com boa taxa — celebre a disciplina; não aumente a carga agora.',
      });
    } else {
      const recentMood = moodEntries
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-5);
      if (recentMood.length >= 2) {
        const first = recentMood[0].mood;
        const last = recentMood[recentMood.length - 1].mood;
        if (last > first) {
          insights.push({
            id: 'mood-up',
            title: 'Humor em alta',
            action: 'Tendência positiva — use a energia para fechar o hábito mais difícil primeiro.',
          });
        } else if (last < first) {
          insights.push({
            id: 'mood-down',
            title: 'Humor em queda',
            action: 'Alivie a meta: complete só o essencial hoje e faça a review à noite.',
          });
        }
      }
    }
  }

  // Fallback teasers when little data
  if (insights.length === 0) {
    insights.push({
      id: 'need-data',
      title: 'Ainda coletando padrão',
      action: 'Complete hábitos e feche o dia por alguns dias — os insights ficam concretos.',
    });
  }

  // Cap 2–4
  return insights.slice(0, 4);
}

export function insightTeasers(): Insight[] {
  return [
    {
      id: 'teaser-best',
      title: 'Melhor dia da semana',
      action: 'Veja em qual weekday você mais avança.',
    },
    {
      id: 'teaser-skip',
      title: 'Hábitos mais pulados',
      action: 'Descubra o que cortar ou mover de horário.',
    },
    {
      id: 'teaser-focus',
      title: 'Foco semana a semana',
      action: 'Compare minutos de foco com a semana passada.',
    },
  ];
}

export { weekDayLabels };
