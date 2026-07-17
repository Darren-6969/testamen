// app/module/setting/plan/page.tsx
//
// UI ONLY. There is no payment flow yet, so nothing here is wired to the API.
// Everything below the MOCK DATA block is real, working UI — swapping the
// constants for a fetch is the whole of the future task.
//
// Card layout and copy follow the legacy Pricing Plans table. All four tiers
// share the same feature set there; only storage and price differ, which is why
// storage is pulled out above the shared list on each card.
//
// Storage: mt_feature.storage_mb is the source of truth for a tier's base
// allowance. Referral bonuses (mt_user_account.referral_bonus_mb, capped by
// mt_referral_settings) are configured admin-side and are deliberately NOT shown
// on these cards — they vary per account and are not a property of the tier.
//
// TODO(plan-api): replace MOCK_PLANS with GET /api/customer-setting/plan, built from:
//   mt_feature                 -> catalog (id, feature_plan, storage_mb, price_rm, status)
//   mt_user_account.feature_id -> current plan (null => Free)
//   mt_payment_plan            -> history (user_id = mt_user_account.id),
//                                 reference_no / invoice_no / receipt_no / status
//   storage_mb is varchar in mt_feature — parseInt it before passing to storageMb.
// TODO(plan-features): the per-tier feature list and taglines are hardcoded here.
//   The legacy had no table for them either — it was static HTML. If they ever
//   need to be editable, they need a table; mt_feature has no column for them.
// TODO(plan-payments): legacy posted to feature_payment/plan-submit.php (Stripe).
//   Until that exists, ENABLE_UPGRADE stays false.
// TODO(plan-receipts): legacy linked view_receipt.php?ref= / view_invoice.php?ref=.
//   Until converted, RECEIPT_BASE_URL stays empty and the buttons stay disabled.
'use client';

import { CreditCard } from 'lucide-react';
import PageHeader from '@/components/header/PageHeader';
import SettingCard from '@/components/setting/SettingCard';
import PlanCard, { PlanState } from '@/components/setting/PlanCard';

// Flip on once the Stripe/plan-submit equivalent exists.
const ENABLE_UPGRADE = false;
// Set once view_receipt / view_invoice are converted.
const RECEIPT_BASE_URL = '';

// ---------------------------------------------------------------------------
// MOCK DATA — mirrors the real mt_feature rows so the UI is representative.
// ---------------------------------------------------------------------------

// Every tier carries the same features in the legacy pricing table.
const SHARED_FEATURES = [
  'Memorial Account',
  'Unlimited pictures upload',
  'Unlimited video upload',
  'Access to Obituary',
  'Access to Thanksgiving',
  'Others Upload',
];

interface MockPlan {
  id: number;
  name: string;
  priceRm: number;
  /** Matches mt_feature.storage_mb. */
  storageMb: number;
  tagline: string;
  badge?: string;
}

interface MockPayment {
  planId: number;
  referenceNo: string;
  invoiceNo: string;
  receiptNo: string;
  amountRm: number;
  paidAt: string;
}

const MOCK_PLANS: MockPlan[] = [
  {
    id: 1,
    name: 'Free',
    priceRm: 0,
    storageMb: 50,
    tagline: 'Start preserving memories',
  },
  {
    id: 2,
    name: 'Standard',
    priceRm: 20,
    storageMb: 100,
    tagline: 'More room for photos and videos',
  },
  {
    id: 3,
    name: 'Plus',
    priceRm: 100,
    storageMb: 500,
    tagline: 'For a fuller memorial',
    badge: 'Popular',
  },
  {
    id: 4,
    name: 'Premium',
    priceRm: 200,
    storageMb: 1024,
    tagline: 'The complete experience',
  },
];

const MOCK_CURRENT_PLAN_ID = 3; // Plus

const MOCK_PAYMENTS: MockPayment[] = [
  {
    planId: 2,
    referenceNo: 'PL202512020311359EB2',
    invoiceNo: 'INV000001',
    receiptNo: 'RCPT000001',
    amountRm: 20,
    paidAt: '2 Dec 2025',
  },
  {
    planId: 3,
    referenceNo: 'PL202512020348107F21',
    invoiceNo: 'INV000002',
    receiptNo: 'RCPT000002',
    amountRm: 100,
    paidAt: '2 Dec 2025',
  },
];
// ---------------------------------------------------------------------------

export default function PlanPage() {
  const currentPlan =
    MOCK_PLANS.find((p) => p.id === MOCK_CURRENT_PLAN_ID) ?? MOCK_PLANS[0];

  // Legacy rule: any plan ranked at or below the highest plan ever purchased is
  // "Not available" — you cannot re-buy or downgrade to it.
  const highestPurchasedId = MOCK_PAYMENTS.reduce((max, p) => Math.max(max, p.planId), 0);

  const planState = (planId: number): PlanState => {
    if (planId === currentPlan.id) return 'current';
    if (planId <= highestPurchasedId) return 'unavailable';
    return 'upgradable';
  };

  const openDoc = (kind: 'receipt' | 'invoice', ref: string) => {
    if (!RECEIPT_BASE_URL) return;
    window.open(`${RECEIPT_BASE_URL}/${kind}?ref=${encodeURIComponent(ref)}`, '_blank');
  };

  return (
    <div
      className="space-y-6"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      <PageHeader
        icon={<CreditCard className="w-6 h-6 text-[#c3195d]" />}
        subtitle="Your current plan, storage allowance, and payment history"
      >
        <span className="text-[#c3195d]">Plan &amp; Subscription</span>
      </PageHeader>

      {/* Pricing cards — full width, not inside the narrow SettingCard shell. */}
      <section>
        <h2 className="text-m font-semibold tracking-[0.08em] text-gray-800 uppercase">
          Pricing Plans
        </h2>
        {!ENABLE_UPGRADE && (
          <p className="mt-1 text-sm text-[var(--form-text-caption)]">
            Plan upgrades are not available yet. Contact support if you need to change
            your plan.
          </p>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {MOCK_PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              name={plan.name}
              priceRm={plan.priceRm}
              storageMb={plan.storageMb}
              tagline={plan.tagline}
              features={SHARED_FEATURES}
              badge={plan.badge}
              state={planState(plan.id)}
              upgradeDisabled={!ENABLE_UPGRADE}
              onUpgrade={() => {
                /* TODO(plan-payments): open checkout for plan.id */
              }}
            />
          ))}
        </div>
      </section>

      <SettingCard
        title="Payment History"
        description={
          RECEIPT_BASE_URL
            ? undefined
            : 'Receipts and invoices are not available for download yet.'
        }
        className="max-w-none"
      >
        {MOCK_PAYMENTS.length === 0 ? (
          <p className="text-sm text-[var(--form-text-caption)]">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-left">
                  <th className="pb-2 font-medium text-[var(--form-text-caption)]">Date</th>
                  <th className="pb-2 font-medium text-[var(--form-text-caption)]">Plan</th>
                  <th className="pb-2 font-medium text-[var(--form-text-caption)]">
                    Invoice
                  </th>
                  <th className="pb-2 font-medium text-[var(--form-text-caption)]">
                    Receipt
                  </th>
                  <th className="pb-2 font-medium text-[var(--form-text-caption)] text-right">
                    Amount
                  </th>
                  <th className="pb-2 font-medium text-[var(--form-text-caption)] text-right">
                    Documents
                  </th>
                </tr>
              </thead>
              <tbody>
                {MOCK_PAYMENTS.map((p) => (
                  <tr
                    key={p.referenceNo}
                    className="border-b border-[var(--border-color)] last:border-0"
                  >
                    <td className="py-3">{p.paidAt}</td>
                    <td className="py-3">
                      {MOCK_PLANS.find((pl) => pl.id === p.planId)?.name ?? '—'}
                    </td>
                    <td className="py-3">{p.invoiceNo}</td>
                    <td className="py-3">{p.receiptNo}</td>
                    <td className="py-3 text-right">RM {p.amountRm.toFixed(2)}</td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openDoc('receipt', p.referenceNo)}
                          disabled={!RECEIPT_BASE_URL}
                          className="px-2 py-1 rounded-md border border-[var(--border-color)] text-[11px] text-[var(--form-text-caption)] hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Receipt
                        </button>
                        <button
                          type="button"
                          onClick={() => openDoc('invoice', p.referenceNo)}
                          disabled={!RECEIPT_BASE_URL}
                          className="px-2 py-1 rounded-md border border-[var(--border-color)] text-[11px] text-[var(--form-text-caption)] hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SettingCard>
    </div>
  );
}