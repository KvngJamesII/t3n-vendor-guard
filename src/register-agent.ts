/**
 * Register VendorGuard as a public T3N agent (DID + agent card).
 * Docs: https://docs.terminal3.io/developers/agents/register-agent
 */
import { writeFile } from "node:fs/promises";
import { createSession, envName, requireEnv } from "./lib/t3n.js";

const agentKey = requireEnv("AGENT_KEY");
const env = envName();

console.log("[VendorGuard] Authenticating agent key…");
const { client, did: agentDid } = await createSession(agentKey, env);
console.log("Agent DID:", agentDid);

const card = {
  type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  name: "VendorGuard",
  description:
    "Enterprise accounts-payable agent: policy-checks vendor invoices, auto-approves within limits, and routes payment instructions through T3N TEE so bank details never enter agent memory. Built for easy handover and long-term maintenance.",
  image: "https://terminal3.io/favicon.ico",
  services: [
    { name: "DID", endpoint: agentDid, version: "v1" },
  ],
  x402Support: false,
  active: true,
  registrations: [],
  supportedTrust: ["tee-attestation"],
  skills: [
    "invoice-policy-check",
    "duplicate-detection",
    "tee-payment-instruction",
    "member-delegation-aware",
  ],
  maintainer: {
    email: "onlyidledev@gmail.com",
    github: "https://github.com/KvngJamesII/t3n-vendor-guard",
  },
};

await writeFile("agent-card.json", JSON.stringify(card, null, 2));
console.log("Wrote agent-card.json");

// Attempt org-data / agent-card publish if SDK exposes helpers
try {
  const anyClient = client as any;
  if (typeof anyClient.execute === "function") {
    console.log("Attempting host via execute (may require credits)…");
    // Discovery first
    try {
      const { discoverWhoami } = await import("@terminal3/t3n-sdk");
      console.log("whoami helper present", typeof discoverWhoami);
    } catch {}
  }
} catch (e: any) {
  console.warn("publish attempt:", e.message?.slice?.(0, 300));
}

console.log("\nAGENT_DID=" + agentDid);
console.log(
  "Note: `t3n agent host-card` CLI currently fails on malformed trust-manifest (see BUGS.md).",
);
console.log(
  "With credits funded, re-run: T3N_API_KEY=$AGENT_KEY npx @terminal3/t3n-sdk agent host-card --file agent-card.json --env testnet",
);
