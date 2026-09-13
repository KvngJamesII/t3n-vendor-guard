/**
 * Offline policy demo — no API keys required.
 * Proves usefulness + maintainability of the decision core.
 */
import { VendorGuardAgent, DEFAULT_POLICY } from "./lib/agent.js";
import type { Invoice } from "./policy/types.js";

const agent = new VendorGuardAgent(DEFAULT_POLICY);

const samples: Invoice[] = [
  {
    invoiceId: "INV-1001",
    vendorId: "V-ACME",
    vendorName: "Acme Supplies",
    amountCents: 12_500,
    currency: "USD",
    invoiceDate: "2026-09-10",
    lineItems: [{ description: "Office paper", quantity: 10, unitCents: 1250 }],
  },
  {
    invoiceId: "INV-1002",
    vendorId: "V-GLOBEX",
    vendorName: "Globex Corp",
    amountCents: 85_000,
    currency: "USD",
    invoiceDate: "2026-09-11",
    poNumber: "PO-7781",
    lineItems: [{ description: "Cloud seats", quantity: 5, unitCents: 17000 }],
  },
  {
    invoiceId: "INV-1003",
    vendorId: "V-SHADY",
    vendorName: "Shady LLC",
    amountCents: 9_000,
    currency: "USD",
    invoiceDate: "2026-09-11",
    lineItems: [],
  },
  {
    invoiceId: "INV-1004",
    vendorId: "V-ACME",
    vendorName: "Acme Supplies",
    amountCents: 250_000,
    currency: "USD",
    invoiceDate: "2026-09-12",
    // missing PO on purpose
    lineItems: [{ description: "Server racks", quantity: 2, unitCents: 125000 }],
  },
  // duplicate of INV-1001
  {
    invoiceId: "INV-1001",
    vendorId: "V-ACME",
    vendorName: "Acme Supplies",
    amountCents: 12_500,
    currency: "USD",
    invoiceDate: "2026-09-10",
    lineItems: [],
  },
];

console.log("=== VendorGuard policy demo (offline) ===\n");
for (const raw of samples) {
  const { invoice, decision } = agent.decide(raw);
  const pay = agent.toPaymentInstruction(invoice, decision);
  console.log(`• ${invoice.invoiceId} / ${invoice.vendorId} / $${(invoice.amountCents / 100).toFixed(2)}`);
  console.log(`  → ${decision.status}: ${decision.reasons.join("; ")}`);
  if (pay) {
    console.log(`  → payment instruction placeholder: ${pay.paymentProfilePlaceholder}`);
  }
  console.log();
}
