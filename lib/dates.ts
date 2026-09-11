import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);
dayjs.locale('pt-br');

export { dayjs };

export function todayKey(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function formatDateKey(d: Date | string = new Date()): string {
  return dayjs(d).format('YYYY-MM-DD');
}

export function isAfter18h(): boolean {
  return dayjs().hour() >= 18;
}

export function weekDayKeys(): string[] {
  const start = dayjs().startOf('isoWeek');
  return Array.from({ length: 7 }, (_, i) => start.add(i, 'day').format('YYYY-MM-DD'));
}

export function weekDayLabels(): string[] {
  return ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
}

export function monthKey(d: Date | string = new Date()): string {
  return dayjs(d).format('YYYY-MM');
}

export function friendlyToday(): string {
  return dayjs().format('dddd, D [de] MMMM');
}
