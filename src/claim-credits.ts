import {
  T3nClient, setEnvironment, loadWasmComponent,
  eth_get_address, metamask_sign, createEthAuthInput,
  TenantClient, getNodeUrl,
} from "@terminal3/t3n-sdk";
import "dotenv/config";

const key = process.env.T3N_API_KEY!;
setEnvironment("testnet");
const wasm = await loadWasmComponent();
const address = eth_get_address(key);
const client = new T3nClient({
  trustAnchor: { unsafe_trust_server: true },
  wasmComponent: wasm,
  handlers: { EthSign: metamask_sign(address, undefined, key) },
});
await client.handshake();
const didRes = await client.authenticate(createEthAuthInput(address));
const did = (didRes as any).value;
console.log("DID", did);

const tenant = new TenantClient({ t3n: client, baseUrl: getNodeUrl(), tenantDid: did });
console.log("tenant keys", Object.keys(tenant as any));
console.log("tenant.tenant keys", Object.keys((tenant as any).tenant || {}));
console.log("token keys", Object.keys((tenant as any).token || {}));

for (const [name, fn] of [
  ["tenant.claim", () => (tenant as any).tenant?.claim?.()],
  ["tenant.me", () => (tenant as any).tenant?.me?.()],
  ["token.balance", () => (tenant as any).token?.balance?.()],
  ["token.claim", () => (tenant as any).token?.claim?.()],
] as const) {
  try {
    const r = await (fn as any)();
    console.log(name, "=>", JSON.stringify(r)?.slice(0, 400));
  } catch (e: any) {
    console.log(name, "ERR", e.message?.slice?.(0, 250) || e);
  }
}
