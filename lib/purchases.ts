import { Platform } from 'react-native';
import { ENTITLEMENT_ID, PRODUCTS } from '@/constants/pricing';

export type PurchaseResult =
  | { ok: true; isPro: boolean }
  | { ok: false; error: string; mocked?: boolean };

type PurchasesModule = typeof import('react-native-purchases');

let Purchases: PurchasesModule['default'] | null = null;
let configured = false;
let useMock = false;

const RC_IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY ?? '';
const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '';

async function loadPurchases(): Promise<boolean> {
  if (Purchases) return true;
  try {
    const mod = await import('react-native-purchases');
    Purchases = mod.default;
    return true;
  } catch {
    useMock = true;
    return false;
  }
}

export async function initPurchases(): Promise<void> {
  const loaded = await loadPurchases();
  if (!loaded || !Purchases) {
    useMock = true;
    return;
  }
  try {
    const apiKey = Platform.OS === 'ios' ? RC_IOS_KEY : RC_ANDROID_KEY;
    if (!apiKey || apiKey.includes('YOUR_')) {
      useMock = true;
      return;
    }
    Purchases.configure({ apiKey });
    configured = true;
  } catch {
    useMock = true;
  }
}

export function isPurchasesMock(): boolean {
  return useMock || !configured;
}

export async function checkProEntitlement(): Promise<boolean> {
  if (isPurchasesMock() || !Purchases) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return Boolean(info.entitlements.active[ENTITLEMENT_ID]);
  } catch {
    return false;
  }
}

export async function purchasePackage(
  productId: string
): Promise<PurchaseResult> {
  if (isPurchasesMock() || !Purchases) {
    // DEV mock — caller should set isPro via store
    return { ok: true, isPro: true, mocked: true } as PurchaseResult & {
      mocked: true;
    };
  }
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) {
      return { ok: false, error: 'Nenhuma oferta disponível' };
    }
    const pkg =
      current.availablePackages.find(
        (p) => p.product.identifier === productId
      ) ??
      (productId === PRODUCTS.annual.id
        ? current.annual
        : current.monthly) ??
      null;
    if (!pkg) {
      return { ok: false, error: 'Produto não encontrado' };
    }
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPro = Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);
    return { ok: true, isPro };
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean; message?: string };
    if (err?.userCancelled) {
      return { ok: false, error: 'Compra cancelada' };
    }
    return { ok: false, error: err?.message ?? 'Falha na compra' };
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  if (isPurchasesMock() || !Purchases) {
    return { ok: true, isPro: false, mocked: true } as PurchaseResult & {
      mocked: true;
    };
  }
  try {
    const info = await Purchases.restorePurchases();
    const isPro = Boolean(info.entitlements.active[ENTITLEMENT_ID]);
    return { ok: true, isPro };
  } catch (e: unknown) {
    const err = e as { message?: string };
    return { ok: false, error: err?.message ?? 'Falha ao restaurar' };
  }
}
