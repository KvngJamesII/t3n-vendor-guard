# TEE contract (optional next step)

VendorGuard’s decision core is TypeScript and maintainable offline. For production payment dispatch inside a TEE:

1. Clone reference: `git clone https://github.com/Terminal-3/z-tenant-flight.git` (sibling folder).
2. Adapt WIT exports to `evaluate-invoice` / `dispatch-payment` with `http-with-placeholders` for vendor payment profiles.
3. Build: `rustup target add wasm32-wasip2 && cargo build --target wasm32-wasip2 --release`
4. Register via TenantClient (`docs/register-contract.md`) once credits are funded.

Keeping the Rust contract optional post-challenge reduces maintenance burden while preserving a clear upgrade path.
