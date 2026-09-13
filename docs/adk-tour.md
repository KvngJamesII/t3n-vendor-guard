> ## Documentation Index
> Fetch the complete documentation index at: https://docs.terminal3.io/llms.txt
> Use this file to discover all available pages before exploring further.

# ADK Tour

> The shape of the ADK in five pieces, before you write any code.

If you're new here, this page is the map. It won't teach you to build anything — [Quickstart](/developers/adk/get-started/quickstart) does that in under 10 minutes — but it'll save you from guessing what each piece is for while you read the rest of the docs.

The ADK is built around five ideas. Everything else in these docs is a detail of one of these.

<Steps>
  <Step title="You are a tenant">
    When you sign in and get an API key, T3N gives you a **tenant identity** — an opaque ID (`did:t3n:...`) that everything you own is scoped to: your data, your contracts, your credits. It's not derived from your wallet, and you never construct it yourself — you always read it back from an authenticated session.
  </Step>

  <Step title="Your data lives in a private map, by default">
    Anything you store (an API key, a config value, application state) goes into a **tenant KV map**, namespaced under your tenant ID so no other tenant can ever read or write it. Access within your own maps is opt-in — you explicitly say what a contract is allowed to touch. See [Create Tenant KV Maps](/developers/adk/tips/create-kv-maps).
  </Step>

  <Step title="Logic that touches sensitive data runs as a TEE contract">
    A **TEE contract** is a small Rust program, compiled to WebAssembly, that runs inside confidential-computing hardware (a TEE). The point of running it there instead of on your own server: the contract can process user PII and call third-party APIs on a user's behalf, without your infrastructure — or you — ever seeing the plaintext. See [Write your first TEE contract](/developers/adk/get-started/walkthrough/write-contract).
  </Step>

  <Step title="Agents act on delegated permission, not blanket trust">
    An AI agent doesn't get standing access to anything. A user (or you, acting on your own tenant) explicitly grants an agent permission to call specific functions on a specific contract, optionally scoped to specific external hosts it's allowed to reach. No grant, no access — the contract still runs, the outbound call just gets denied. See [Member Delegation](/developers/adk/get-started/member-delegation).
  </Step>

  <Step title="PII moves through the enclave, never through your code">
    When a contract needs to send a user's real name, email, or other personal data to a third-party API, it doesn't handle that data directly. It sends a request with `{{profile.field}}` placeholder markers, and the host substitutes the real values inside the enclave at the last moment. Your contract — and anything logging or inspecting it — only ever sees the placeholder. See [Placeholders in outbound calls](/developers/adk/tips/placeholders-outbound-calls).
  </Step>
</Steps>

## Where to go next

<CardGroup cols={2}>
  <Card title="Quickstart" icon="bolt" href="/developers/adk/get-started/quickstart">
    Get an authenticated call working in under 10 minutes.
  </Card>

  <Card title="Write your first TEE contract" icon="file-code" href="/developers/adk/get-started/walkthrough/write-contract">
    The full walkthrough, with a real worked example.
  </Card>

  <Card title="Member Delegation" icon="key" href="/developers/adk/get-started/member-delegation">
    How a member delegates scoped permission to an agent, and how agents authenticate.
  </Card>

  <Card title="Common Errors" icon="triangle-exclamation" href="/developers/adk/tips/common-errors">
    Bookmark this one — you'll want it.
  </Card>
</CardGroup>
