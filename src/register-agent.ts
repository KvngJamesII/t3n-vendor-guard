/**
 * Register VendorGuard as a public T3N agent (DID + agent card).
 * Docs: https://docs.terminal3.io/developers/agents/register-agent
 *
 * Uses the CLI (`t3n`) when available; falls back to documenting the commands.
 */
import { writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { createSession, envName, requireEnv } from "./lib/t3n.js";

const agentKey = requireEnv("AGENT_KEY");
const env = envName();

console.log("[VendorGuard] Authenticating agent key…");
const { did: agentDid } = await createSession(agentKey, env);
console.log("Agent DID:", agentDid);

const card = {
  type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  name: "VendorGuard",
  description:
    "Enterprise accounts-payable agent: policy-checks vendor invoices, auto-approves within limits, and routes payment instructions through T3N TEE so bank details never enter agent memory. Built for easy handover and long-term maintenance.",
  image: "https://terminal3.io/favicon.ico",
  services: [
    {
      name: "DID",
      endpoint: agentDid,
      version: "v1",
    },
    {
      name: "MCP",
      endpoint: "https://localhost:3100/mcp",
      version: "2025-06-18",
    },
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

// Prefer CLI host-card
const who = spawnSync(
  "npx",
  ["@terminal3/t3n-sdk", "whoami", "--env", env],
  {
    env: { ...process.env, T3N_API_KEY: agentKey },
    encoding: "utf8",
  },
);
console.log("t3n whoami:", who.stdout?.trim() || who.stderr?.slice(0, 400));

const host = spawnSync(
  "npx",
  [
    "@terminal3/t3n-sdk",
    "agent",
    "host-card",
    "--file",
    "agent-card.json",
    "--env",
    env,
  ],
  {
    env: { ...process.env, T3N_API_KEY: agentKey },
    encoding: "utf8",
  },
);
if (host.status === 0) {
  console.log("Card hosted:\n", host.stdout);
} else {
  console.warn(
    "host-card CLI failed (card file is still ready). stderr:\n",
    host.stderr?.slice(0, 800),
  );
  console.warn(
    "Manual: export T3N_API_KEY=$AGENT_KEY && npx @terminal3/t3n-sdk agent host-card --file agent-card.json --env testnet",
  );
}

console.log("\nAGENT_DID=" + agentDid);
