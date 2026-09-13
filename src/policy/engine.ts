import type { Decision, Invoice, Policy } from "./types.js";

/** In-memory duplicate ledger for demos; swap for KV map in production. */
export class DuplicateLedger {
  private seen = new Map<string, number>(); // key -> epoch ms

  key(inv: Invoice): string {
    return `${inv.vendorId}|${inv.amountCents}|${inv.currency}|${inv.invoiceId}`;
  }

  remember(inv: Invoice, now = Date.now()) {
    this.seen.set(this.key(inv), now);
  }

  isDuplicate(inv: Invoice, windowDays: number, now = Date.now()): boolean {
    const t = this.seen.get(this.key(inv));
    if (t == null) return false;
    return now - t <= windowDays * 86_400_000;
  }
}

export function evaluateInvoice(
  inv: Invoice,
  policy: Policy,
  ledger: DuplicateLedger,
): Decision {
  const reasons: string[] = [];

  if (policy.blockedVendors.includes(inv.vendorId)) {
    return { status: "REJECT", reasons: [`Vendor ${inv.vendorId} is blocked`] };
  }

  if (!policy.allowedCurrencies.includes(inv.currency)) {
    return {
      status: "REJECT",
      reasons: [`Currency ${inv.currency} not allowed`],
    };
  }

  if (!policy.approvedVendors.includes(inv.vendorId)) {
    return {
      status: "REJECT",
      reasons: [`Vendor ${inv.vendorId} is not on the approved list`],
    };
  }

  if (ledger.isDuplicate(inv, policy.duplicateWindowDays)) {
    return {
      status: "REJECT",
      reasons: [`Duplicate invoice detected within ${policy.duplicateWindowDays}d window`],
    };
  }

  if (
    inv.amountCents >= policy.requirePoAboveCents &&
    (!inv.poNumber || inv.poNumber.trim() === "")
  ) {
    reasons.push(
      `Amount ${(inv.amountCents / 100).toFixed(2)} ${inv.currency} requires a PO (threshold ${(policy.requirePoAboveCents / 100).toFixed(2)})`,
    );
    return { status: "NEEDS_HUMAN", reasons };
  }

  if (inv.amountCents <= policy.autoApproveMaxCents) {
    reasons.push(
      `Within auto-approve ceiling ${(policy.autoApproveMaxCents / 100).toFixed(2)} ${inv.currency}`,
    );
    reasons.push(`Vendor ${inv.vendorId} approved`);
    return { status: "AUTO_APPROVE", reasons };
  }

  reasons.push(
    `Amount ${(inv.amountCents / 100).toFixed(2)} exceeds auto-approve ${(policy.autoApproveMaxCents / 100).toFixed(2)} — human review required`,
  );
  return { status: "NEEDS_HUMAN", reasons };
}
