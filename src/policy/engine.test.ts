import { test } from "node:test";
import assert from "node:assert/strict";
import { DuplicateLedger, evaluateInvoice } from "./engine.js";
import type { Invoice, Policy } from "./types.js";

const policy: Policy = {
  approvedVendors: ["V-ACME", "V-GLOBEX"],
  autoApproveMaxCents: 50_000,
  requirePoAboveCents: 100_000,
  blockedVendors: ["V-SHADY"],
  allowedCurrencies: ["USD"],
  duplicateWindowDays: 30,
};

const base: Invoice = {
  invoiceId: "INV-1",
  vendorId: "V-ACME",
  vendorName: "Acme Supplies",
  amountCents: 25_000,
  currency: "USD",
  invoiceDate: "2026-09-01",
  lineItems: [],
};

test("auto-approves small approved vendor invoice", () => {
  const d = evaluateInvoice(base, policy, new DuplicateLedger());
  assert.equal(d.status, "AUTO_APPROVE");
});

test("rejects blocked vendor", () => {
  const d = evaluateInvoice(
    { ...base, vendorId: "V-SHADY" },
    policy,
    new DuplicateLedger(),
  );
  assert.equal(d.status, "REJECT");
});

test("needs human above auto-approve", () => {
  const d = evaluateInvoice(
    { ...base, amountCents: 75_000, poNumber: "PO-9" },
    policy,
    new DuplicateLedger(),
  );
  assert.equal(d.status, "NEEDS_HUMAN");
});

test("needs PO above threshold", () => {
  const d = evaluateInvoice(
    { ...base, amountCents: 150_000 },
    policy,
    new DuplicateLedger(),
  );
  assert.equal(d.status, "NEEDS_HUMAN");
  assert.match(d.reasons.join(" "), /requires a PO/);
});

test("detects duplicates", () => {
  const ledger = new DuplicateLedger();
  ledger.remember(base);
  const d = evaluateInvoice(base, policy, ledger);
  assert.equal(d.status, "REJECT");
  assert.match(d.reasons.join(" "), /Duplicate/);
});
