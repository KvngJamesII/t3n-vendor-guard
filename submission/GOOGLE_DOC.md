# VendorGuard — Superteam T3N Agent Build Challenge

**Repo (public):** https://github.com/KvngJamesII/t3n-vendor-guard  
**Listing:** https://superteam.fun/earn/listing/t3n-agent-build-challenge/  
**Builder:** IdleDev · GitHub [KvngJamesII](https://github.com/KvngJamesII) · onlyidledev@gmail.com  
**Solana:** `2Uup61Xjcqpyh9jfSNKBfHr4J1Ju7qjzDyUzFpdmduwW`

## Continue vs handover
**Prefer to continue running** VendorGuard under Terminal 3’s startup / listing program. Full handover process is in the repo README if T3N prefers to operate it.

## DID
- **Tenant DID:** `did:t3n:bb159fd3ebf660bb970df7ce800ebd831ef73100`
- Agent DID: `did:t3n:1297a5ff02b03f54d7ed4b96e18468f74a133ada` (0 credits until funded)

## What we built
Enterprise **accounts-payable / vendor-invoice policy agent** on Terminal 3 ADK patterns:

| Decision | Example |
|----------|---------|
| AUTO_APPROVE | Approved vendor, ≤ $500 |
| NEEDS_HUMAN | Over ceiling or missing PO |
| REJECT | Blocked vendor / bad currency / duplicate |

Payment instructions use **TEE-safe placeholders** (`{{vendor.ID.payment_profile}}`) so bank PII never enters agent memory — aligned with T3N payroll/procurement use cases.

## Maintainability (judging focus)
- Pure policy core (`src/policy/*`) — Zod schemas, unit tests, zero network
- Thin T3N wrappers (`src/lib/t3n.ts`)
- Offline demo: `npm run demo:policy`
- Skill file for AI coding assistants included

## Screenshots / evidence
See repo `submission/`:
- Policy demo + test output (`demo-policy-output.txt`, `test-output.txt`)
- Claim / email OTP flow screenshots
- Auth log: DID obtained on testnet

## Bugs faced
See **BUGS.md** (trust-manifest malformed in SDK 5.15.2; email path yields 0 credits vs Google claim; honeypot DX).

## How to run
```bash
git clone https://github.com/KvngJamesII/t3n-vendor-guard
cd t3n-vendor-guard && npm i
npm test && npm run demo:policy
# with funded keys:
cp .env.example .env   # T3N_API_KEY + AGENT_KEY
npm run quickstart && npm run register-agent
```

## Docs completed
Quickstart + walkthrough references mirrored under `docs/` from https://docs.terminal3.io/llms.txt
