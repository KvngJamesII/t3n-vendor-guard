/**
 * End-to-end: authenticate tenant + agent, run policy, emit TEE payment intent.
 *
 * Full TEE contract registration (Rust WASM) is optional for the challenge —
 * see contracts/README.md and HANDOVER.md. This script demonstrates the
 * ADK auth path + member-delegation shape without requiring outbound HTTP.
 */
import { createSession, createTenantFromSession, envName, requireEnv } from "./lib/t3n.js";
import { VendorGuardAgent, DEFAULT_POLICY } from "./lib/agent.js";

const env = envName();
const tenantKey = requireEnv("T3N_API_KEY");
const agentKey = process.env.AGENT_KEY;

console.log("=== VendorGuard end-to-end (T3N) ===\n");

const tenantSession = await createSession(tenantKey, env);
console.log("Tenant DID:", tenantSession.did);
await createTenantFromSession(tenantSession.client, tenantSession.did);

let agentDid: string | undefined;
if (agentKey && !agentKey.startsWith("0x_your")) {
  const agentSession = await createSession(agentKey, env);
  agentDid = agentSession.did;
  console.log("Agent DID:", agentDid);
} else {
  console.warn("AGENT_KEY not set — skipping agent session (policy still runs).");
}

const agent = new VendorGuardAgent(DEFAULT_POLICY);
const { invoice, decision } = agent.decide({
  invoiceId: "INV-E2E-1",
  vendorId: "V-ACME",
  vendorName: "Acme Supplies",
  amountCents: 19_900,
  currency: "USD",
  invoiceDate: "2026-09-13",
  lineItems: [{ description: "Toner", quantity: 2, unitCents: 9950 }],
});
const pay = agent.toPaymentInstruction(invoice, decision);

console.log("\nDecision:", decision);
console.log("Payment instruction (TEE-safe):", pay);

console.log(`
Handover note:
  Prefer Terminal 3 to host/maintain this agent post-challenge.
  Startup program: https://terminal3.io/startup-program
  Delegation grant example (data owner signs):

  await userClient.updateMemberDelegation({
    grantee: "${agentDid ?? "did:t3n:AGENT"}",
    contract_id: "z:<tid>:vendor-guard",
    version_req: "0.1.0",
    functions: ["evaluate-invoice", "dispatch-payment"],
    allowed_hosts: ["api.stripe.com"],
    scopes: ["invoices", "vendors"],
  });
`);
