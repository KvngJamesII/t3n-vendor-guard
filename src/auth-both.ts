import { createSession, envName } from "./lib/t3n.js";
import { writeFileSync } from "fs";
import { spawnSync } from "child_process";

const env = envName();
const tenant = await createSession(process.env.T3N_API_KEY!, env);
console.log("TENANT_DID", tenant.did);
writeFileSync("submission/private/tenant-did.txt", tenant.did);

const agent = await createSession(process.env.AGENT_KEY!, env);
console.log("AGENT_DID", agent.did);
writeFileSync("submission/private/agent-did.txt", agent.did);

// usage
for (const [label, c] of [["tenant", tenant.client], ["agent", agent.client]] as const) {
  try {
    const u = await c.getUsage();
    console.log(label, "usage", JSON.stringify(u).slice(0,300));
  } catch (e: any) {
    console.log(label, "usage err", e.message?.slice?.(0,150));
  }
}

// Write agent card and try host
const card = {
  type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  name: "VendorGuard",
  description:
    "Enterprise AP policy agent on T3N: auto-approve / escalate / reject vendor invoices with duplicate detection and TEE-safe payment placeholders. Built for maintainability and handover.",
  services: [
    { name: "DID", endpoint: agent.did, version: "v1" },
  ],
  x402Support: false,
  active: true,
  registrations: [],
  supportedTrust: ["tee-attestation"],
};
writeFileSync("agent-card.json", JSON.stringify(card, null, 2));

const host = spawnSync("npx", ["@terminal3/t3n-sdk", "agent", "host-card", "--file", "agent-card.json", "--env", env], {
  env: { ...process.env, T3N_API_KEY: process.env.AGENT_KEY },
  encoding: "utf8",
  maxBuffer: 2_000_000,
});
console.log("host status", host.status);
const out = (host.stdout || "") + (host.stderr || "");
console.log(out.split("\n").filter(l => l.length < 200).slice(0, 40).join("\n"));
