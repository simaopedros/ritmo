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

## Checklist — App Store / Play (publicar)

### Contas e identidade
- [ ] Apple Developer Program ativo + App Store Connect app `Ritmo` (`com.ritmo.app`)
- [ ] Google Play Console app criado com package `com.ritmo.app`
- [ ] EAS project: `eas init` / colar `extra.eas.projectId` real em `app.json`
- [ ] Ícone 1024×1024, splash, adaptive icons (assets já no repo — validar visual final)

### Assinaturas / IAP
- [ ] App Store Connect → Subscriptions: `ritmo_pro_monthly`, `ritmo_pro_annual` + trial 7 dias
- [ ] Google Play → Subscriptions: mesmos product IDs + free trial 7 dias
- [ ] Privacy policy URL + Terms of Use (assinatura auto-renovável) linkados nas stores
- [ ] RevenueCat: apps iOS/Android, products, entitlement `pro`, offering **Current**
- [ ] Colar keys públicas (`EXPO_PUBLIC_RC_IOS_KEY` / `EXPO_PUBLIC_RC_ANDROID_KEY`) em `.env` **e** EAS secrets
- [ ] Sandbox testers (Apple) + license testers (Google)

### Compliance / metadata
- [ ] Screenshots dark premium: Hoje, Foco, Progresso, Paywall (iPhone 6.7" + 6.1"; Android phone)
- [ ] Descrição curta/longa, keywords, categoria (Productivity / Health & Fitness)
- [ ] Age rating / content rating questionnaire
- [ ] Data safety / privacy nutrition labels (AsyncStorage local; compras via store; sem tracking se N/A)
- [ ] Export compliance / encryption (standard HTTPS only se aplicável)

### Build & submit
- [ ] `eas build -p ios --profile production`
- [ ] `eas build -p android --profile production` (AAB)
- [ ] Testar **restore purchases** em device real (não Expo Go) com sandbox
- [ ] `eas submit -p ios` / `eas submit -p android` (ou upload manual)
- [ ] Review notes: explicar mock vs produção, conta sandbox, fluxo Pro

### Pós-submit
- [ ] Remover / esconder toggle **DEV · Toggle Pro** em builds de produção (ou `!__DEV__`)
- [ ] Monitorar crashes (Sentry opcional) e cancelamentos RevenueCat

## Estrutura

```
app/               expo-router (tabs + modals)
components/        UI + FocusRing SVG + animações
constants/         theme + pricing
lib/               dates + purchases (mock-aware)
store/             zustand + async-storage persist
```
