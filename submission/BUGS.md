# Bugs / friction notes (T3N ADK + Earn submission)

1. **Claim form cookie banner** overlaps Industry / Campaign fields on https://terminal3.io ADK claim page — had to dismiss cookies before completing Industry dropdown (screenshots `ss-claim-form.png`, `ss-after-google.png`).
2. **Google SSO** on the claim form showed prolonged “Google Signing in…” state; needed retry / allow cookies for auth to finish.
3. Campaign code field accepted variants; Earn brief points at `go.terminal3.io/adk-community` — keep Superteam campaign code from that redirect (do not invent).
4. Docs tree is split across `docs.terminal3.io` ADK quickstart and payroll/delegation use-cases; a single “enterprise agent happy path” page would reduce time-to-first-register.
5. SDK expects **separate** tenant vs agent keys — easy to reuse one key by mistake (called out in `.env.example`).
