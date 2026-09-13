import type { Invoice, Policy, PaymentInstruction, Decision } from "../policy/types.js";
import { InvoiceSchema, PolicySchema } from "../policy/types.js";
import { DuplicateLedger, evaluateInvoice } from "../policy/engine.js";

/**
 * VendorGuardAgent — pure decision layer.
 * Network / TEE payment dispatch lives in end-to-end.ts so this stays
 * unit-testable and easy to maintain after handover.
 */
export class VendorGuardAgent {
  readonly policy: Policy;
  readonly ledger: DuplicateLedger;
  readonly name = "VendorGuard";
  readonly version = "1.0.0";

  constructor(policy: Policy, ledger = new DuplicateLedger()) {
    this.policy = PolicySchema.parse(policy);
    this.ledger = ledger;
  }

  decide(raw: unknown): { invoice: Invoice; decision: Decision } {
    const invoice = InvoiceSchema.parse(raw);
    const decision = evaluateInvoice(invoice, this.policy, this.ledger);
    if (decision.status !== "REJECT") {
      // Remember non-rejected for duplicate detection after approval path
      this.ledger.remember(invoice);
    } else if (/Duplicate/.test(decision.reasons.join(" "))) {
      // already in ledger
    } else {
      // still remember rejected? No — allow corrected resubmits of same id after fix
    }
    return { invoice, decision };
  }

  /** Build a TEE-safe payment instruction (no bank PII in agent memory). */
  toPaymentInstruction(
    invoice: Invoice,
    decision: Decision,
  ): PaymentInstruction | null {
    if (decision.status === "REJECT") return null;
    return {
      invoiceId: invoice.invoiceId,
      vendorId: invoice.vendorId,
      amountCents: invoice.amountCents,
      currency: invoice.currency,
      paymentProfilePlaceholder: `{{vendor.${invoice.vendorId}.payment_profile}}`,
      decision,
      decidedAt: new Date().toISOString(),
    };
  }
}

export const DEFAULT_POLICY: Policy = {
  approvedVendors: ["V-ACME", "V-GLOBEX", "V-INITECH"],
  autoApproveMaxCents: 50_000,
  requirePoAboveCents: 100_000,
  blockedVendors: ["V-SHADY"],
  allowedCurrencies: ["USD", "USDC"],
  duplicateWindowDays: 30,
};
