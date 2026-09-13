import {
  T3nClient, setEnvironment, loadWasmComponent,
  eth_get_address, metamask_sign, createEthAuthInput,
  fetchTrustedManifest, TenantClient, getNodeUrl,
} from "@terminal3/t3n-sdk";
import "dotenv/config";
import { writeFileSync } from "fs";

const key = process.env.T3N_API_KEY!;
if (!key) throw new Error("no T3N_API_KEY");

setEnvironment("testnet");
const wasm = await loadWasmComponent();
let trustAnchor: any;
try {
  trustAnchor = await fetchTrustedManifest("testnet");
  console.log("manifest: ok");
} catch (e: any) {
  console.log("manifest FAIL (BUG):", e.message);
  trustAnchor = { unsafe_trust_server: true };
  console.log("fallback: unsafe_trust_server");
}
const address = eth_get_address(key);
console.log("eth address:", address);
const client = new T3nClient({
  trustAnchor,
  wasmComponent: wasm,
  handlers: { EthSign: metamask_sign(address, undefined, key) },
});
await client.handshake();
console.log("handshake ok");
const didRes = await client.authenticate(createEthAuthInput(address));
const did = (didRes as any).value ?? String(didRes);
console.log("DID:", did);
writeFileSync("submission/private/tenant-did.txt", did);
try {
  const tenant = new TenantClient({ t3n: client, baseUrl: getNodeUrl(), tenantDid: did });
  await tenant.tenant.me();
  console.log("TenantClient ready");
} catch (e: any) {
  console.log("TenantClient:", e.message?.slice?.(0, 200) || e);
}
try {
  const usage = await client.getUsage();
  console.log("usage:", JSON.stringify(usage).slice(0, 400));
  writeFileSync("submission/private/usage.json", JSON.stringify(usage, null, 2));
} catch (e: any) {
  console.log("usage:", e.message?.slice?.(0, 200) || e);
}
