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

## Marca / assets

Ícone 1024×1024, splash, adaptive Android e favicon em `assets/images/` — fundo `#0B0B0F`, accent `#7C5CFF`.

## EAS / stores

**TODO (Simão):** este ambiente não tem `eas login`. No teu Mac:

```bash
eas login
npx eas-cli@latest init --non-interactive   # grava projectId real em app.json
```

Não inventar UUID. Guia completo com cliques (App Store Connect, Play Console, RevenueCat): ver **[STORE.md](./STORE.md)**.

Política de privacidade e termos (GitHub Pages): [https://simaopedros.github.io/ritmo/privacy.html](https://simaopedros.github.io/ritmo/privacy.html), [https://simaopedros.github.io/ritmo/terms.html](https://simaopedros.github.io/ritmo/terms.html) — fontes em [`docs/`](./docs/). Pacote de screenshots da loja: [`store-screenshots/`](./store-screenshots/).

Resumo checklist:
- [ ] `eas init` → `extra.eas.projectId` real
- [ ] ASC + Play apps `com.ritmo.app`
- [ ] Products `ritmo_pro_monthly` / `ritmo_pro_annual` + trial 7 dias
- [ ] RevenueCat entitlement `pro` + keys em `.env` / EAS secrets
- [x] Privacy / Terms ([privacy](https://simaopedros.github.io/ritmo/privacy.html), [terms](https://simaopedros.github.io/ritmo/terms.html)) + screenshots (`store-screenshots/`)
- [ ] `eas build` production → testar restore em device → `eas submit`
- [ ] Esconder **DEV · Toggle Pro** em produção

## Estrutura

```
app/                 expo-router (tabs + modals)
components/          UI + FocusRing SVG + animações
constants/           theme + pricing
docs/                GitHub Pages site (privacy/terms + index) · https://simaopedros.github.io/ritmo/
lib/                 dates + purchases (mock-aware)
store/               zustand + async-storage persist
store-screenshots/   pacote App Store / Play
```
