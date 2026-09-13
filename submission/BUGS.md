# Bugs / rough edges faced (VendorGuard — T3N ADK challenge)

## 1. `fetchTrustedManifest("testnet")` rejected as malformed (SDK 5.15.2)
**Severity:** High — blocks the documented quickstart trust path.  
**Repro:** `await fetchTrustedManifest("testnet")` against `https://cn-api.sg.testnet.t3n.terminal3.io/api/trust-manifest`.  
**Observed:** Endpoint returns valid JSON (`cluster`, `peer_ids`, `rtmr3_allowlist`, `signature`), but `@terminal3/t3n-sdk@5.15.2` throws `Trust manifest … is malformed.`  
**Workaround:** `{ unsafe_trust_server: true }` (documented opt-out for local/dev). Implemented in `src/lib/t3n.ts` with a warning.  
**Ask:** Confirm expected manifest schema for SDK 5.15.x vs docs that still cite 5.2.0.

## 2. ADK claim page is Google-SSO-only; email OTP path yields 0 credits
**Severity:** High for Superteam builders asked to use email.  
**Repro:** Email OTP via `app.terminal3.io` (`/api/user/v3/connect` + `/api/user/v2/challenge`) successfully returns a wallet `private_key` usable as `T3N_API_KEY`, authenticates to a `did:t3n:…`, but `getUsage()` shows `available: 0`. Tenant `me()` / `claim()` fail with `InsufficientCredit`.  
**ADK claim UI** (`/products/agent-developer-kit`) only offers **Login with Google** before “Claim credits” (campaign code `SUPERAI2026`).  
**Ask:** Expose email OTP (or password) claim that also runs `tenant_admit` + 20k test credits; or auto-fund keys minted via `app.terminal3.io` wallet export.

## 3. `app.terminal3.io` login honeypot
**Severity:** Low / DX.  
**Repro:** Checking “remember me” sets `honeypot_activated: true` → `Invalid request detected.`  
**Ask:** Label honeypot fields for accessibility tools / document in FAQ.

## 4. Docs version skew
Docs samples pin `@terminal3/t3n-sdk@5.2.0`; npm resolves `^5.15.2`. Trust-manifest parsing may have diverged.

## 5. OTP code expiry during multi-agent automation
Codes expire in 3 minutes; concurrent resends invalidate earlier codes (user-provided `530473` was already expired when entered).
