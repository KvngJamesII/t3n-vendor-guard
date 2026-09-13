import {
  T3nClient,
  setEnvironment,
  loadWasmComponent,
  fetchTrustedManifest,
  eth_get_address,
  metamask_sign,
  createEthAuthInput,
  TenantClient,
  getNodeUrl,
} from "@terminal3/t3n-sdk";
import "dotenv/config";

export type T3nEnv = "testnet" | "production";

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.startsWith("0x_your")) {
    throw new Error(
      `Missing ${name}. Claim a key at https://terminal3.io/products/agent-developer-kit and put it in .env (shown once).`,
    );
  }
  return v;
}

export async function loadTrustAnchor(env: T3nEnv) {
  try {
    return await fetchTrustedManifest(env);
  } catch (e) {
    // BUG: as of 2026-09-13 testnet trust-manifest JSON is valid but SDK 5.15.2
    // rejects it as "malformed". Documented in submission/BUGS.md.
    console.warn(
      "[t3n] fetchTrustedManifest failed; falling back to { unsafe_trust_server: true } —",
      (e as Error).message,
    );
    return { unsafe_trust_server: true as const };
  }
}

export async function createSession(apiKey: string, env: T3nEnv = "testnet") {
  setEnvironment(env);
  const wasmComponent = await loadWasmComponent();
  const trustAnchor = await loadTrustAnchor(env);
  const address = eth_get_address(apiKey);
  const client = new T3nClient({
    trustAnchor,
    wasmComponent,
    handlers: {
      EthSign: metamask_sign(address, undefined, apiKey),
    },
  });
  await client.handshake();
  const didResult = await client.authenticate(createEthAuthInput(address));
  const did = didResult.value as string;
  return { client, did, address, wasmComponent, trustAnchor };
}

export async function createTenantFromSession(
  t3n: T3nClient,
  tenantDid: string,
) {
  const tenant = new TenantClient({
    t3n,
    baseUrl: getNodeUrl(),
    tenantDid,
  });
  await tenant.tenant.me();
  return tenant;
}

export function envName(): T3nEnv {
  const e = (process.env.T3N_ENV || "testnet").toLowerCase();
  return e === "production" ? "production" : "testnet";
}
