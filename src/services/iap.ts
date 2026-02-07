/**
 * In-App Purchase Service
 *
 * Wraps expo-in-app-purchases for iOS/Android purchase flow.
 * When IAP is unavailable (e.g., dev mode), falls back to mock purchases.
 */

import type { CreditPack } from '../types';

// ────────────────────────────────────────
// Types
// ────────────────────────────────────────
export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  receipt?: string;
  error?: string;
}

// ────────────────────────────────────────
// IAP Ready check (placeholder for expo-in-app-purchases)
// ────────────────────────────────────────
export const iapReady = false; // Will be true when expo-in-app-purchases is configured

// ────────────────────────────────────────
// Purchase credits
// ────────────────────────────────────────
export const purchaseCreditPack = async (pack: CreditPack): Promise<PurchaseResult> => {
  if (!iapReady) {
    // Mock purchase
    await new Promise((r) => setTimeout(r, 500));
    return {
      success: true,
      transactionId: `mock-txn-${Date.now()}`,
    };
  }

  // Real IAP flow (to be implemented with expo-in-app-purchases)
  // const purchase = await InAppPurchases.purchaseItemAsync(pack.id);
  // return { success: true, transactionId: purchase.transactionId, receipt: purchase.receipt };

  return { success: false, error: 'IAP not implemented yet.' };
};

// ────────────────────────────────────────
// Verify receipt with backend (placeholder)
// ────────────────────────────────────────
export const verifyPurchase = async (
  _receipt: string,
  _platform: 'ios' | 'android',
): Promise<{ valid: boolean; credits?: number }> => {
  // In production, send receipt to your backend for verification
  return { valid: true };
};
