export const PRODUCTS = {
  monthly: {
    id: 'ritmo_pro_monthly',
    priceBRL: 'R$29,90',
    priceUSD: '$7.99',
    label: 'Mensal',
    period: '/mês',
  },
  annual: {
    id: 'ritmo_pro_annual',
    priceBRL: 'R$149,90',
    priceUSD: '$39.99',
    label: 'Anual',
    period: '/ano',
    badge: 'Melhor valor',
    default: true,
  },
} as const;

export const ENTITLEMENT_ID = 'pro';

export const TRIAL_COPY = '7 dias grátis';

export const FREE_LIMITS = {
  maxHabits: 3,
  maxFocusPerDay: 2,
  historyDays: 7,
  /** Free users get exactly one reminder (habit OR Fechar o dia). */
  maxReminders: 1,
} as const;

export const PRO_FEATURES = [
  'Insights semanais com ações concretas',
  '1 congelamento de streak por mês',
  'Lembretes em todos os hábitos + Fechar o dia',
  'Hábitos ilimitados',
  'Foco ilimitado por dia',
  'Histórico completo',
] as const;
