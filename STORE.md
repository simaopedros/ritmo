# Ritmo — guia de publicação (pt-BR)

Passo a passo **exato** para Simão. Contas pessoais (Apple / Google / Expo / RevenueCat) são necessárias — o repo não cria projectId falso.

Privacy URL: [https://simaopedros.github.io/ritmo/privacy.html](https://simaopedros.github.io/ritmo/privacy.html) ([fonte](./docs/privacy.html))  
Terms URL: [https://simaopedros.github.io/ritmo/terms.html](https://simaopedros.github.io/ritmo/terms.html) ([fonte](./docs/terms.html))  
Cópias Markdown: [`docs/privacy.md`](./docs/privacy.md), [`docs/terms.md`](./docs/terms.md)  
Screenshots: [`store-screenshots/`](./store-screenshots/) (ordem e captions em `store-screenshots/README.md`)

Bundle / package: `com.ritmo.app` · Scheme: `ritmo` · Entitlement: `pro`

| Product ID | Plano | BR | US | Trial |
|------------|-------|----|----|-------|
| `ritmo_pro_monthly` | Mensal | R$29,90 | $7.99 | 7 dias |
| `ritmo_pro_annual` | Anual (default UI) | R$149,90 | $39.99 | 7 dias |

---

## 0. EAS projectId (obrigatório antes do build)

Expo **não** está logado neste ambiente. No teu Mac:

1. `npm i -g eas-cli` (ou use `npx eas-cli@latest`)
2. `eas login` → conta Expo ligada ao GitHub `simaopedros` (ou email)
3. Na pasta do repo:
   ```bash
   cd ritmo
   npx eas-cli@latest init --non-interactive
   ```
   Se pedir conta: `npx eas-cli@latest init --account SEU_USER_EXPO --non-interactive`
4. Confirma que `app.json` → `expo.extra.eas.projectId` recebeu um **UUID real** (não inventar).
5. Commit: `chore: link eas projectId`

> **TODO:** rodar `eas init` com a tua conta. Sem isso, `eas build` falha.

---

## 1. App Store Connect (iOS)

1. Abre [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → **+** → **New App**
2. Plataforma: **iOS**
3. Name: `Ritmo`
4. Primary Language: Portuguese (Brazil) (ou English)
5. Bundle ID: seleciona / cria `com.ritmo.app` (Apple Developer → Identifiers, se ainda não existir)
6. SKU: `ritmo-ios-001` (qualquer string interna)
7. User Access: Full Access

### Assinaturas
1. App → **Subscriptions** → cria Subscription Group `Ritmo Pro`
2. **+** Subscription:
   - Reference Name: `Ritmo Pro Monthly`
   - Product ID: **`ritmo_pro_monthly`** (não muda depois)
   - Duração: 1 month
   - Price: BR ≈ R$29,90 / US $7.99
   - Introductory Offer: **Free** · 7 days · New subscribers
3. Repete para anual:
   - Reference Name: `Ritmo Pro Annual`
   - Product ID: **`ritmo_pro_annual`**
   - Duração: 1 year
   - Price: BR ≈ R$149,90 / US $39.99
   - Free trial 7 days
4. Localization (pt-BR + en): display name `Ritmo Pro`, description curta
5. **Paid Apps Agreement** + banking/tax devem estar Active

### Metadata mínimo
- Privacy Policy URL: `https://simaopedros.github.io/ritmo/privacy.html`
- Category: Productivity (sec.: Health & Fitness)
- Screenshots dark: ver `store-screenshots/` (Hoje, Foco, Review, Paywall, Perfil — 6.7" + 6.1")
- Age Rating questionnaire
- App Privacy: dados locais (AsyncStorage); compras via Apple; sem tracking se N/A

### Sandbox
Users and Access → Sandbox → Testers → cria tester para restore / purchase

---

## 2. Google Play Console (Android)

1. [Play Console](https://play.google.com/console) → **Create app**
2. App name: `Ritmo` · Default language: Portuguese (Brazil)
3. App / Game: App · Free · declarations
4. Dashboard → complete **Privacy policy** (`https://simaopedros.github.io/ritmo/privacy.html`), **App content**, **Data safety**

### Assinaturas
1. Monetize → **Products** → **Subscriptions** → **Create subscription**
2. Product ID: **`ritmo_pro_monthly`**
   - Base plan: auto-renewing, 1 month, price BR/US
   - Offer: free trial 7 days (new customer acquisition)
3. Create subscription Product ID: **`ritmo_pro_annual`**
   - Base plan: 1 year + free trial 7 days
4. Activate base plans / offers
5. License testing: Setup → License testing → adiciona emails Gmail

Package name no AAB deve ser `com.ritmo.app` (já no `app.json`).

---

## 3. RevenueCat

1. [RevenueCat](https://app.revenuecat.com) → **Create project** `Ritmo`
2. Add apps:
   - iOS: bundle `com.ritmo.app` · cola App Store Connect Shared Secret / In-App Purchase key
   - Android: package `com.ritmo.app` · cola Play service account JSON
3. **Product catalog** → import / add:
   - `ritmo_pro_monthly`
   - `ritmo_pro_annual`
4. **Entitlements** → cria `pro` → anexa os dois products
5. **Offerings** → offering **Current**:
   - Package monthly → `ritmo_pro_monthly`
   - Package annual → `ritmo_pro_annual` (default na UI)
6. Copia API keys **public** (appl_… / goog_…):
   - `.env` → `EXPO_PUBLIC_RC_IOS_KEY` / `EXPO_PUBLIC_RC_ANDROID_KEY`
   - EAS Secrets: `eas secret:create` com os mesmos nomes

---

## 4. Build & submit

```bash
eas login
# garantir projectId em app.json (passo 0)

eas build -p ios --profile production
eas build -p android --profile production   # gera AAB

# device real (não Expo Go) — sandbox / license tester
# testar purchase + restore

eas submit -p ios --profile production
eas submit -p android --profile production
```

`eas.json` já tem profiles `development` / `preview` / `production` e submit Android track `internal`.

---

## 5. Checklist rápido

- [ ] `eas init` + `projectId` real no `app.json`
- [ ] ASC app + subscriptions `ritmo_pro_monthly` / `ritmo_pro_annual` + trial 7d
- [ ] Play app + mesmos product IDs + trial 7d
- [x] Privacy / Terms no ar ([privacy](https://simaopedros.github.io/ritmo/privacy.html), [terms](https://simaopedros.github.io/ritmo/terms.html))
- [ ] RevenueCat entitlement `pro` + offering Current
- [ ] Keys no `.env` e EAS secrets
- [ ] Screenshots (`store-screenshots/`) + metadata
- [ ] Production build + sandbox test + submit

Assets de marca (`assets/images/icon.png` 1024, splash, adaptive, favicon) já estão no repo — tema `#0B0B0F` / accent `#7C5CFF`.
