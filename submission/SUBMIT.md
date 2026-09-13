# Human steps remaining (Earn submission)

## Already done by agent
- Public repo: https://github.com/KvngJamesII/t3n-vendor-guard
- Working VendorGuard policy agent + 5/5 tests + offline demo
- Email OTP login as onlyidledev@gmail.com (not Google OAuth)
- Tenant DID obtained: `did:t3n:bb159fd3ebf660bb970df7ce800ebd831ef73100`
- `.env` has `T3N_API_KEY` + `AGENT_KEY` (local only; gitignored)
- Bugs documented in `submission/BUGS.md`
- Google Doc draft: `submission/GOOGLE_DOC.md`

## Blocker: sandbox credits = 0
Email-wallet key authenticates but has **0 T3N credits**. ADK “Claim credits” UI requires Google SSO.

### Option A — preferred (30–60s) — ADK Google claim
1. Open https://terminal3.io/products/agent-developer-kit (same as https://go.terminal3.io/adk-community).
2. Login with Google as **onlyidledev@gmail.com**.
3. Fill name / industry / role; campaign `SUPERAI2026` or Superteam code.
4. Click **Claim credits** — copy API key **once** into `.env` as `T3N_API_KEY`.
5. Repeat once more for `AGENT_KEY` (separate claim).
6. Locally: `npm run quickstart && npm run register-agent && npm run demo:end-to-end`.

### Option B — Telegram (sponsor note on listing)
DM https://t.me/wardumb with DID `did:t3n:bb159fd3ebf660bb970df7ce800ebd831ef73100` and quote **Superteam**.

## Earn form fields
- Email: onlyidledev@gmail.com
- DID: did:t3n:bb159fd3ebf660bb970df7ce800ebd831ef73100
- Continue vs hand over: **Prefer continue running** (startup program); handover docs in README.
- Link: public Google Doc (paste `GOOGLE_DOC.md`) + https://github.com/KvngJamesII/t3n-vendor-guard
- Solana payout: 2Uup61Xjcqpyh9jfSNKBfHr4J1Ju7qjzDyUzFpdmduwW

## Bonus
Tweet tagging @terminal3io with repo link (optional).
