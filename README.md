# Ritmo

App Expo (SDK 57 / expo-router) — hábitos + foco Pomodoro + review diária + assinatura Pro.

Bundle / package: `com.ritmo.app` · Scheme: `ritmo` · Entitlement: `pro`

## Rodar

```bash
cd /workspace/ritmo
npm install
cp .env.example .env   # opcional — sem keys usa mock DEV
npx expo start
```

- iOS Simulator / Android Emulator / Expo Go
- `react-native-purchases` cai em **DEV mock** no Expo Go (sem módulo nativo / sem keys)

```bash
npx tsc --noEmit
npx expo export   # bundle estático (pode exigir mais memória)
```

## Produtos (RevenueCat / stores)

| Plano   | Product ID           | BR      | US    | Notas                          |
|---------|----------------------|---------|-------|--------------------------------|
| Mensal  | `ritmo_pro_monthly`  | R$29,90 | $7.99 | —                              |
| Anual   | `ritmo_pro_annual`   | R$149,90| $39.99| **Melhor valor** · default UI  |

- Trial copy: **7 dias grátis**
- Sem plano semanal
- Entitlement: `pro`
- Congelamento de streak: **1 por mês** no Pro

## Limites Free vs Pro

|                  | Free                         | Pro                          |
|------------------|------------------------------|------------------------------|
| Hábitos          | 3 (4º → hard paywall)        | Ilimitado                    |
| Foco / dia       | 2 (3º → hard paywall)        | Ilimitado                    |
| Review diária    | Sim                          | Sim                          |
| Insights         | Bloqueados                   | Liberados                    |
| Histórico        | 7 dias                       | Completo                     |
| Streak freeze    | —                            | 1 / mês                      |

Soft paywall (dismissível): após 1º hábito **e** 1º foco; e após 1ª review.

## UX — Fechar o dia

Na aba **Hoje**, botão **Fechar o dia** abre o sheet de review (mood 1–5 + nota). Após **18:00** local o CTA ganha destaque (badge “Agora”). Completar a review atualiza o **streak**. O app **não** bloqueia após 18h.

## Variáveis de ambiente

Ver `.env.example`:

- `EXPO_PUBLIC_RC_IOS_KEY`
- `EXPO_PUBLIC_RC_ANDROID_KEY`

## Checklist lojas

- [ ] Criar app App Store Connect + Google Play (`com.ritmo.app`)
- [ ] Produtos IAP: `ritmo_pro_monthly`, `ritmo_pro_annual` (+ trial 7 dias)
- [ ] RevenueCat: apps iOS/Android, products, entitlement `pro`, offering Current
- [ ] Colar keys públicas no `.env` / EAS secrets
- [ ] Privacy policy + termos (assinatura auto-renovável)
- [ ] Screenshots dark premium (Hoje, Foco, Progresso, Paywall)
- [ ] Build EAS: `eas build -p ios` / `eas build -p android`
- [ ] Testar restore purchases em device real (não Expo Go)
- [ ] Sandbox / license testers

## Estrutura

```
app/               expo-router (tabs + modals)
components/        UI + FocusRing SVG + animações
constants/         theme + pricing
lib/               dates + purchases (mock-aware)
store/             zustand + async-storage persist
```
