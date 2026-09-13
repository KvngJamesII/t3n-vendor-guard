> ## Documentation Index
> Fetch the complete documentation index at: https://docs.terminal3.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Member Delegation

> How a member delegates scoped authority to an AI agent (or another principal), and how an agent authenticates to T3N.

This page covers two separate things that are easy to conflate: an agent **authenticating** to T3N (proving who it is), and an agent being **authorized** to call a specific contract function (proving it's allowed to).

<Info>
  This is about **agents** acting through your contract. If you're looking for how *you*, the tenant developer, authenticate to manage your own deployment, see [Set Up Development Environment](/developers/adk/get-started/prerequisites/set-up-dev-env) instead — that's a different session.

  This page assumes the agent **already has a DID**. Creating that identity in the first place — minting the agent and publishing its agent card — is [Agent Onboarding](/developers/agents/register-agent), which happens before anything on this page.

  That identity also needs its **own** test credits before any metered call on this page will work — an agent DID's balance is separate from its tenant's and starts at zero. Get it a key from the same [claim page](/developers/adk/get-started/prerequisites/request-test-tokens) you used for your own; it comes with credits attached.
</Info>

## 1. An agent authenticates like any other T3N session

An agent has its own identity — its own key pair and its own DID — separate from the tenant that owns the contract it's calling. It authenticates the same way any T3N client does: handshake, then authenticate, then read its own DID back from the session. There's nothing tenant-specific to configure here.

```typescript theme={null}
import {
  T3nClient,
  loadWasmComponent,
  createEthAuthInput,
  eth_get_address,
  metamask_sign,
  fetchTrustedManifest,
} from "@terminal3/t3n-sdk";

const agentKey = process.env.AGENT_KEY!; // a separate key for the agent — never reuse your tenant's T3N_API_KEY
const agentAddress = eth_get_address(agentKey);

const agentClient = new T3nClient({
  trustAnchor: await fetchTrustedManifest("testnet"),
  wasmComponent,
  handlers: {
    EthSign: metamask_sign(agentAddress, undefined, agentKey),
  },
});

await agentClient.handshake();
const agentDid = await agentClient.authenticate(createEthAuthInput(agentAddress));
```

<Warning>
  Never hard-code or derive an agent's DID any more than you would a tenant's — always read it back from the authenticated session, exactly as `agentDid` is read above. And generate `AGENT_KEY` as its own separate credential (the same way you'd generate any Ethereum-style keypair) — don't reuse your tenant's `T3N_API_KEY` for an agent.
</Warning>

## 2. Being authenticated is not being authorized

Authenticating proves the agent's identity. It does **not** grant it permission to call anything. Before an agent can invoke a contract function — especially one that makes an outbound HTTP call — the **user who owns the data** (the "data owner," not the agent, and not you as the tenant developer) has to explicitly grant that agent access:

```typescript theme={null}
// Signed by the user (data owner), not the agent.
await userClient.execute({
  contract_id: "tee:user/contracts",
  contract_version: userContractVersion,
  function_name: "member-delegation-update",
  input: {
    grants: [{
      grantee: agentDid,                  // the agent being authorized
      contract_id: TENANT_CONTRACT,       // z:<tid>:your-contract-tail
      version_req: contractVersion,
      functions: ["search-offers", "book-offer"],   // exactly which functions
      allowed_hosts: ["api.duffel.com"],  // exactly which external hosts
    }],
  },
});
```

<Warning>
  `member-delegation-update` **replaces the member's entire delegation document.** Whatever you pass as `grants` becomes the complete new policy, so a single-grant write like the one above drops every *other* agent's grants, and `grants: []` revokes all delegated access. To change one grant while leaving the rest intact, read the current policy first (`member-delegation-get`) and write back the merged list — or let the SDK do it for you.

  The same applies to `discover_dids`: it is a document-level field, so a write that omits it clears the member's whole discovery list. Read-merge-write, or omit it deliberately.
</Warning>

To add or change a single grant safely, use the SDK's `updateMemberDelegation`. It reads the current policy, merges your grant by `(grantee, contract_id)`, and writes the whole document back, so every other grant survives:

```typescript theme={null}
// `userClient` is the data owner's authenticated T3nClient (see below).
await userClient.updateMemberDelegation({
  grantee: agentDid,
  contract_id: TENANT_CONTRACT,
  version_req: contractVersion,
  functions: ["search-offers", "book-offer"],
  allowed_hosts: ["api.duffel.com"],
});
```

<Info>
  **Why "member delegation".** The name is for the **delegator**: a member (the data owner) delegates a scoped slice of their own authority to a *grantee*. The grantee is a member too — identified by a DID, whether that's an AI agent (as above) or the member's own DID for a direct call (a self-grant). The same `member-delegation-update` / `member-delegation-get` contract functions (SDK: `updateMemberDelegation` / `getMemberDelegation`) cover both. This page was previously titled "Agent Auth".
</Info>

`userClient` here is the data owner's own authenticated session — built the same way as `t3n`/`agentClient` above, just with the user's own key. See [Invoke your contract](/developers/adk/get-started/walkthrough/invoke-contract) for the full construction and where `TENANT_CONTRACT`/`contractVersion` come from.

A grant is scoped three ways at once: which contract, which functions on it, and which external hosts it may reach. An agent with no matching grant can still call the contract — the call just fails at the point it tries to reach the network, with `host/http.egress_denied`.

### What a grant can say

Every field is snake\_case on the wire, exactly as written here — camelCase keys
(`agentDid`, `scriptName`, `validFromSecs`) are rejected rather than silently
dropped, so a mistyped time-box can't be lost.

| Field           | Required | Meaning                                                                                                                                                               |
| --------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `grantee`       | yes      | The principal this grant applies to — an agent's DID, or the member's own for a self-grant.                                                                           |
| `contract_id`   | yes      | The target contract. `"*"` is accepted but authorises only the core-allowlist contracts, never your own tenant contract — name it exactly.                            |
| `functions`     | yes      | WIT function names the grantee may invoke. `["*"]` matches every function on that contract.                                                                           |
| `scopes`        | yes      | Data scope paths the grantee may access, matched by exact string equality — no wildcards, no prefixes.                                                                |
| `version_req`   | no       | A semver requirement on the target contract version. Omitted matches any version.                                                                                     |
| `read_scopes`   | no       | The subset of `scopes` the grantee may enumerate for itself. Enforced as a subset contract-side.                                                                      |
| `allowed_hosts` | no       | The egress hosts this grant lets the contract reach. Omitted means none — which is what produces `host/http.egress_denied`.                                           |
| `window`        | no       | A validity time-box, `{ valid_from_secs, valid_until_secs }`. Both bounds are optional unix-seconds; an omitted upper bound is capped by the operator, not left open. |

### Org delegation — the second edge

Everything above is the **member** edge: a data owner delegating their own
authority. There is a second, independent edge — **org delegation** — where an
organisation admin grants authority over the org's contracts, written with the
SDK's `OrgDataClient.setDelegation` rather than `updateMemberDelegation`.

A call on the delegated path needs **both** edges to permit it. They are
enforced separately rather than as one combined check, so a missing org grant
and a missing member grant fail in different places. An org grant also carries
less: only `functions` and `scopes` — the qualifiers `version_req`,
`read_scopes`, `allowed_hosts` and `window` are rejected on that edge, so an org
grant cannot carry an expiry or a host allowlist. `checkDelegation()` reports
which edge is missing for a given action.

<Accordion title="Under the Hood: why is it structured this way?">
  Splitting authentication from authorization means a compromised or misbehaving agent key doesn't automatically mean compromised data access — the blast radius of a leaked agent key is exactly whatever contracts, functions, and hosts a user has explicitly granted it, nothing more. It also means a user can revoke an agent's access without the agent's key changing at all — they just stop re-issuing the grant.
</Accordion>

## 3. Stateless invocation with invoke()

Everything above assumes a session: `handshake()` then `authenticate()`, held open across calls. An org-owned agent has a second, stateless option — `invoke()` posts once to `POST /api/invoke` and authenticates by an opaque API key instead, with **no handshake, no `Session-Id`, no session state at all**:

```typescript theme={null}
import { invoke, InvokeError } from "@terminal3/t3n-sdk";

try {
  const result = await invoke({
    baseUrl: "https://cn-api.sg.testnet.t3n.terminal3.io",
    apiKey: process.env.AGENT_API_KEY!, // t3n_key_<...> — see Provision an org-owned agent
    request: {
      contract_id: TENANT_CONTRACT,
      contract_version: contractVersion,
      function_name: "search-offers",
      input: { origin: "LHR", destination: "JFK", departure_date: "2026-07-15", cabin_class: "economy", adult_count: 1 },
    },
  });
} catch (err) {
  if (err instanceof InvokeError) {
    // A fixed, generic message — never the raw api key, response body, or
    // underlying network error. Safe to log as-is.
    console.error(err.message, err.status);
  }
  throw err;
}
```

The agent presents its key verbatim in the `X-T3N-Api-Key` header (`t3n_key_<key-id>.<secret>`) — the same key printed once when you minted the agent, see [Register an Organization-owned Agent](/developers/agents/provision-org-agent). The node derives the acting agent DID from the key per call and runs the same execution pipeline the session `execute` path runs, returning the contract's decoded result directly (no JSON-RPC envelope to unwrap).

<Warning>
  `invoke()` refuses to send the api key over anything but HTTPS, unless the host is a local-dev loopback (`localhost` / `127.0.0.1` / `[::1]`) — an insecure `baseUrl` throws before any network activity. This is a fixed transport rule, not something you configure.
</Warning>

Use `invoke()` for a one-shot call from somewhere a long-lived session doesn't fit — a webhook handler, a serverless function, a cron job — and the session-based flow above (`T3nClient.handshake()`/`authenticate()`) for anything that makes several calls and can hold a session open. `pii_did` on the request is the delegated-call target — set it to act on behalf of another org member; omit it for a self call.

## Direct (self) calls work the same way

If a user is invoking their own contract directly rather than through a separate agent, the same grant mechanism applies — they just grant to their own DID (a self-grant) instead of an agent's.

## Full working example

See [Invoke your contract](/developers/adk/get-started/walkthrough/invoke-contract) for this in context, including the search/book contract call itself. For why the outbound call fails without a grant even when the contract code is correct, see [Outbound HTTP calls are authorized by the user, not the contract](/developers/adk/tips/outbound-http-auth-by-user).

<Note>
  Older community code sometimes references a standalone *delegation-credential* API — functions for building and signing a per-call delegation credential (an "envelope"). That flow was removed when T3N moved to **envelope-free** authorisation, and it is not part of the current SDK (confirmed against `testnet-v1.0.9`, `@terminal3/t3n-sdk` 5.2.0). Authority is now the standing on-chain member delegation shown above (intersected with any org-granted authority), so `member-delegation-update` — not a per-call credential — is the write surface.
</Note>
