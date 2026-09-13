# VendorGuard — Terminal 3 (T3N) enterprise agent

**Earn listing:** [Try out new docs to build a trusted agent with T3N](https://earn.superteam.fun/listing/t3n-agent-build-challenge) ($290 USDC pool)  
**Author:** IdleDev / [@KvngJamesII](https://github.com/KvngJamesII)  
**Handover preference:** Prefer to **continue running** this agent under Terminal 3’s startup/listing program; full handover notes included below if T3N prefers to operate it.

## What it does

VendorGuard is an **accounts-payable policy agent** for enterprises:

- Auto-approves small invoices from an approved vendor list
- Escalates larger invoices (and missing POs) to a human
- Rejects blocked vendors, bad currencies, and duplicates
- Emits **TEE-safe payment instructions** that reference vendor payment profiles by placeholder — no bank PII in agent memory

This matches Terminal 3 ADK themes: verifiable agent identity, programmable authorization, and safe payments.

## Why it’s maintainable post-challenge

| Layer | Responsibility | Swap-out |
|-------|----------------|----------|
| `src/policy/*` | Pure decision logic + Zod schemas | Unit-tested; no network |
| `src/lib/agent.ts` | Orchestrates policy → payment instruction | Stable API |
| `src/lib/t3n.ts` + scripts | T3N session / register / invoke | Thin SDK wrappers |
| `contracts/` | On-chain / ADK contract stubs | Versioned independently |

Offline demos run with zero credentials. Live ADK registration only needs `T3N_API_KEY` + `AGENT_KEY` from the [ADK claim page](https://go.terminal3.io/adk-community).

## Quickstart (offline — no API key)

```bash
npm install
npm test
npm run demo:policy
npm run typecheck
```

## Quickstart (T3N sandbox)

1. Claim keys at https://go.terminal3.io/adk-community (campaign / Superteam path).
2. Copy `.env.example` → `.env` and fill `T3N_API_KEY`, `AGENT_KEY` (separate keys).
3. Complete docs walkthrough sections referenced in `docs/`.
4. Register:

```bash
npm run register-agent
npm run demo:end-to-end
```

## Example decisions

```
INV-1001 V-ACME $125     → AUTO_APPROVE
INV-1002 V-GLOBEX $850   → NEEDS_HUMAN (over ceiling)
INV-1003 V-SHADY $90     → REJECT (blocked)
INV-1004 V-ACME $2500    → NEEDS_HUMAN (PO required)
INV-1001 again           → REJECT (duplicate)
```

## Handover process (if T3N operates it)

1. Rotate `AGENT_KEY`; store in org secret manager.
2. Persist `TENANT_DID` / `AGENT_DID` / contract version from registration.
3. Replace in-memory `DuplicateLedger` with T3N KV map (`docs/create-kv-maps.md`).
4. Point `paymentProfilePlaceholder` resolution at your vendor directory.
5. Keep `src/policy` tests green in CI before policy edits.

## Bugs / doc friction noted during build

See [`submission/BUGS.md`](./submission/BUGS.md) and screenshots under `submission/`.

## License

MIT
