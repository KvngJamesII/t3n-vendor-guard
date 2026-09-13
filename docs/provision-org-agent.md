> ## Documentation Index
> Fetch the complete documentation index at: https://docs.terminal3.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Register an Organization-owned Agent

> Mint an agent your organization owns and controls, with a private agent card the org manages — from installing the SDK to reading the card back.

This guide takes an organization from nothing to owning an agent on T3N: a `did:t3n` DID the organization controls, with an agent card that **T3N hosts privately** for the organization to manage — never public unless the organization chooses. Every step uses the `t3n` CLI that ships with the [`@terminal3/t3n-sdk`](https://www.npmjs.com/package/@terminal3/t3n-sdk) package — no code required, for the whole lifecycle: create, read, and update (updating needs CLI 4.25.0 or newer; older installs have an SDK fallback).

<Note>
  **Onboarding, not permissions.** This page gives an agent an *identity* and a *card*. It does not grant the agent access to anything — no user data, no contract functions. That's a separate step the data owner performs afterwards: see [Member Delegation](/developers/adk/get-started/member-delegation).

  **Two onboarding paths.** This is the one where an **organization owns** the agent, with a card kept **private by default**. If instead an agent **registers itself** — public and discoverable — see [Register a Public Agent](/developers/agents/register-agent).
</Note>

The flow is:

1. Download the SDK
2. Get an org admin's key
3. Create your organization
4. Scaffold the agent card
5. Provision the agent
6. Read the card back

<Info>
  All commands that talk to the network accept `--env sandbox|testnet|production` (or the `T3N_ENV` environment variable); `sandbox` and `testnet` are the same test network. `testnet` is the default — the examples below pass it explicitly anyway, so a copied command never depends on your shell.
</Info>

<Steps>
  <Step title="Download the SDK">
    The CLI is part of the TypeScript SDK. You can run it with zero install, or install it globally:

    ```bash theme={null}
    # zero-install — always runs the latest published version
    npx @terminal3/t3n-sdk --help

    # or install globally (Node.js >= 18)
    pnpm add -g @terminal3/t3n-sdk
    t3n --help
    ```

    The rest of this guide uses the global `t3n` form; substitute `npx @terminal3/t3n-sdk` if you skipped the install.
  </Step>

  <Step title="Get an org admin's key">
    The organization admin's key is a standard Ethereum-style **secp256k1 private key** (32 bytes, `0x`-prefixed hex). Provisioning is a write operation that consumes credits, so get this key from the [claim page](/developers/adk/get-started/prerequisites/request-test-tokens) — it's self-serve, issues a fresh key together with metered test credits every time you visit, and a key generated any other way starts with zero credits and can't pay for this step.

    Put the key in your shell's environment; every signing command reads it from there (or from `--api-key`):

    ```bash theme={null}
    export T3N_API_KEY="0x<the org admin's private key>"
    ```

    <Warning>
      Give the admin its **own** key and keep it out of source control. Every command below is signed by this key, so whoever holds it controls the organization and the agents it owns.
    </Warning>
  </Step>

  <Step title="Create your organization">
    Skip this if your organization already exists — just use its DID. Otherwise create one; the authenticated caller becomes its initial admin:

    ```bash theme={null}
    export ORG_DID=$(t3n org create --name "Acme Robotics" --env testnet --json | jq -r .organisationDid)
    echo "$ORG_DID"
    # did:t3n:0a1b2c...
    ```

    Drop `--json` for human-readable output (`organisation created: did:t3n:0a1b2c...`) if you'd rather copy the DID by hand.

    <Warning>
      `org create` is **not** idempotent — every call mints a *new* organization. Run it once and keep the DID; re-running it because you lost the DID leaves an orphan org behind.
    </Warning>
  </Step>

  <Step title="Scaffold the agent card">
    The agent card is a JSON document, following the [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) registration format, that describes the agent and lists its service endpoints — including its [A2A](https://a2a-protocol.org/) agent card. Scaffold one with:

    ```bash theme={null}
    t3n agent create-card --out agent-card.json
    ```

    Run interactively, it walks you through name, description, image, and which services to include (A2A / MCP / DID). In scripts it falls back to flags: `--name`, `--description`, `--image`, `--did`, `--x402`, and `--force`. Replace the placeholders with your agent's real endpoints and keep the whole card under **16 KiB**.

    <Note>
      This step is **optional** — skip it to let T3N host a minimal default card for the agent instead (shown in the next step).
    </Note>
  </Step>

  <Step title="Provision the agent">
    Mint the agent and host its card, all in one transaction. You don't need a URL for the card — T3N serves it at `/api/agent-card/<did>`:

    ```bash theme={null}
    t3n agent create \
      --org "$ORG_DID" \
      --name "Booking Bot" \
      --card agent-card.json \
      --env testnet
    # agent created: did:t3n:1a2b3c...
    # ⚠ API key (shown ONCE — store it now, it is the agent's credential):
    #   t3n_key_43c008200b3a6c2c.6aab9ce6be8f33ba...
    #   key id: 43c008200b3a6c2c
    # private card hosted from agent-card.json (publish with: t3n agent card-publish ...)
    ```

    One transaction mints the agent's DID and its wallet, and hosts the card **privately** under the organization. Nothing is published — the agent is not publicly discoverable, by design.

    <Warning>
      **The API key is printed exactly once and cannot be recovered.** Store it now — it is the agent's *own* credential, what the agent uses to authenticate as itself.

      The agent's secp256k1 key is minted **inside the TEE and never leaves it**; you never see a private key. What you get instead is an opaque bearer token, `t3n_key_<key-id>.<secret>`, of which only a hash is stored on-ledger — which is why it is unrecoverable rather than merely inconvenient to look up. The agent presents it verbatim in the `X-T3N-Api-Key` header of a [stateless `POST /api/invoke`](/developers/adk/get-started/member-delegation#3-stateless-invocation-with-invoke) call.

      Scripting? Use `--json` and capture `.apiKey`, plus `.keyId` (the 16-hex lookup id, safe to log and to store alongside your records — the secret half is not).
    </Warning>

    <Note>
      **Drop `--card` to host a default card.** `t3n agent create --org "$ORG_DID" --name "Booking Bot"` (nothing else) hosts a minimal default card, named after the agent, with its DID as the service entry:

      ```json theme={null}
      {
        "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
        "name": "Booking Bot",
        "description": "T3N-registered agent (default card)",
        "services": [
          { "name": "DID", "endpoint": "did:t3n:1a2b3c...", "version": "v1" }
        ],
        "x402Support": false,
        "active": true,
        "registrations": [],
        "supportedTrust": ["tee-attestation"]
      }
      ```

      Pass `--no-card` to mint the agent with **no** card at all — add one later with `card-set`, which needs the writer grant covered in the last step. And pass `--uri <url>` only if the agent also has its **own** external endpoint you want recorded in its DID document (an `agent-uri` service entry is added for it).
    </Note>
  </Step>

  <Step title="Read the card back">
    The card lives in your organization's private scope. Read it back as an org admin — **no publishing required**:

    ```bash theme={null}
    export AGENT_DID="did:t3n:1a2b3c..."

    t3n agent card-get --owner "$ORG_DID" --agent "$AGENT_DID" --env testnet
    # → the card JSON, returned to authorized readers only
    ```

    Only the organization's admins — or a principal you grant a delegation credential to — can read it. It is **not** exposed at the public `/api/agent-card/<did>` endpoint.

    That's the whole lifecycle for a private org agent — create, read, update — all authenticated, none of it public. If `card-get` returns your card, you're done; updating it takes the one extra grant below.

    <Warning>
      **Updating the card needs one more grant.** `t3n agent card-set --owner "$ORG_DID" --agent "$AGENT_DID" --file agent-card.json` fails for a freshly created org with:

      ```
      error: RPC Error: NotScopeWriter: signing user is not a writer for this scope
      ```

      This is by design, not a bug: org-data keeps two roles separate — **admins manage policy, writers manage data** — and being an admin does not imply write access to any scope. The card you just read was written by the *contract* during `agent create`, not by you.

      To write it yourself, add your own DID to the `agent-cards` scope's writer list. One call, once per scope:

      ```bash theme={null}
      t3n org writers-add --org "$ORG_DID" --scope agent-cards --writer "$(t3n whoami)" --env testnet
      # writers updated for scope 'agent-cards'
      ```

      `card-set` then succeeds, and `card-get` returns the updated card. Check the list any time with `t3n org writers-get --org "$ORG_DID" --scope agent-cards`.

      <Note>
        The writer verbs need `@terminal3/t3n-sdk` **4.25.0 or newer** (`npx @terminal3/t3n-sdk` always runs the latest; a pinned older install won't have them). On an older CLI, grant it from the SDK — but `setWriters` **replaces** the list, so read it first and merge, or you will revoke every other writer on the scope:

        ```ts theme={null}
        import { SessionOrgDataClient, AGENT_CARDS_SCOPE } from "@terminal3/t3n-sdk";

        const orgData = new SessionOrgDataClient(t3n, nodeUrl); // authenticated as an org admin
        const { writers } = await orgData.writersGet({ orgDid, scope: AGENT_CARDS_SCOPE });
        await orgData.setWriters({
          orgDid,
          scope: AGENT_CARDS_SCOPE,
          writers: [...new Set([...writers, adminDid])],
        });
        ```
      </Note>
    </Warning>

    <Note>
      **Granting and revoking write access.** `writers-add` and `writers-remove` adjust the list and leave the other writers alone — the usual choice. `writers-set` **replaces** the whole list, so anyone you omit loses access; `writers-clear` removes everyone, leaving the scope unwritable until you grant again. All four require an org admin.

      `add` and `remove` read the current list and write back the result, so two admins editing the same scope at the same moment can overwrite each other. That's fine interactively; scripts that might race should use `writers-set` with the full intended list.
    </Note>

    <Note>
      Reads are metered too. If `card-get` returns `InsufficientCredit`, the account is simply out of credits — top up and retry; nothing is wrong with the card. Metering settles after the fact, so the writes in earlier steps can succeed and then leave the balance short for this read.
    </Note>

    <Tip>
      **Publishing for public discovery (optional).** To list the agent publicly — resolvable by anyone, without a key, at `GET /api/agent-card/<did>` — publish it explicitly: `t3n agent card-publish --owner "$ORG_DID" --agent "$AGENT_DID"`. Consent is already in place (the agent was minted with your organization linked), so it's a single call, reversible with `card-unpublish`. Most org-internal agents never need it.
    </Tip>

    <Accordion title="Under the Hood: where does the private card live?">
      The card is ordinary org-data: `create`/`card-set` store it in your organization's `agent-cards` scope on the built-in `tee:org-data/contracts` TEE contract, at a deterministic entry id derived from `(orgDid, agentDid)`. Reads (`card-get`) go through org-data's normal authorization — an org admin, or a holder of a delegation credential scoped to that read. It is never copied to the world-readable card map unless you explicitly publish it.
    </Accordion>
  </Step>
</Steps>

## What's next

* The agent now has an identity and a card. Next, let it actually *do* something — granting permission to act on users' data and contracts → [Member Delegation](/developers/adk/get-started/member-delegation) and [Delegate Access](/t3n/data-owner-guide/delegate-access)
* How DIDs work on T3N → [Decentralized Identifiers](/t3n/how-t3n-works/did)
* Provisioning and card writes consume credits → [Tokens](/t3n/how-t3n-works/tokens)
