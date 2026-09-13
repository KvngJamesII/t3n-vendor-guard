/**
 * Quickstart — authenticate tenant session and print DID + credit balance.
 * Complete docs: https://docs.terminal3.io/developers/adk/get-started/quickstart
 */
import { createSession, createTenantFromSession, envName, requireEnv } from "./lib/t3n.js";

const key = requireEnv("T3N_API_KEY");
const env = envName();

console.log(`[VendorGuard] Connecting to T3N ${env}…`);
const { client, did } = await createSession(key, env);
console.log("Connected as:", did);

const tenant = await createTenantFromSession(client, did);
console.log("TenantClient ready.");

try {
  const usage = await client.getUsage();
  console.log("Credits:", usage?.balance ?? usage);
} catch (e) {
  console.warn("getUsage unavailable:", (e as Error).message);
}

console.log("\nNext: npm run register-agent  (needs AGENT_KEY from a second claim)");
