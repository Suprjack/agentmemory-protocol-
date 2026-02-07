# AgentMemory Protocol - Deployment Battle Log

> Full record of everything done to get AgentMemory Protocol deployed and working end-to-end on Solana Devnet. Written for other agents working on this project.

## Project Overview

- Solana smart contract (Anchor framework) for on-chain AI agent memory, decisions, and marketplace
- Hackathon deadline: Feb 12, 2026
- Started with: 716 LOC Rust contract, SDK, CLI, tests - but NOTHING deployed or working end-to-end

## Deployed Info

- **Program ID:** `EivtLAsC6pB2DJHd1MdSC9nYByVzcowJoUvqh9GmAjHc`
- **Network:** Solana Devnet
- **Authority/Wallet:** `5wkiaNG9sVBhL9HTWAkt8MpGALhb5YhfjGPA3Lou6paS`
- **Explorer:** https://explorer.solana.com/address/EivtLAsC6pB2DJHd1MdSC9nYByVzcowJoUvqh9GmAjHc?cluster=devnet

---

## Tech Stack (FINAL - Compatible)

| Component | Version | Notes |
|---|---|---|
| Rust (host) | 1.88.0 | Do NOT use for SBF builds directly |
| Rust (SBF target) | 1.75-dev | Bundled with platform-tools |
| Anchor CLI | 0.30.1 | |
| Anchor Rust crate | `anchor-lang = "=0.30.1"` | Pin exact version |
| Solana CLI | 1.18.18 | |
| cargo-build-sbf | From solana-cli 1.18.18 | Uses platform-tools v1.41 |
| Node.js | 22.x | |
| @coral-xyz/anchor | npm 0.30.1 | |
| TypeScript | ts-node for CLI execution | |

---

## Phase 1: Build & Deploy

### Critical Crate Pinning (SBF Rust 1.75-dev Compatibility)

The SBF build target uses Rust 1.75-dev which is incompatible with newer crate versions. Must pin:

```bash
cargo +1.79.0 update -p borsh --precise 1.5.3
cargo +1.79.0 update -p blake3 --precise 1.5.5
cargo +1.79.0 update -p proc-macro-crate --precise 3.2.0
cargo +1.79.0 update -p indexmap --precise 2.6.0
```

**Order matters:** borsh first, then proc-macro-crate, then indexmap.

Also: `Cargo.lock` must be v3 format (not v4). If host Rust 1.88 generates v4:

```bash
cargo +1.79.0 generate-lockfile
```

Then re-pin all crates above.

### Build Command

```bash
cargo-build-sbf --manifest-path programs/agentmemory/Cargo.toml --sbf-out-dir target/deploy
```

**NOT `anchor build`** - anchor build triggers idl-build which crashes due to `anchor-syn` requiring nightly `proc_macro2::Span::source_file()`.

### IDL Generation - MANUAL

`anchor build` and `anchor idl build` both fail because `anchor-syn v0.30.1` calls `proc_macro2::Span::source_file()` which requires nightly + `procmacro2_semver_exempt` cfg flag, but even with those it still fails.

**Solution:** IDL was hand-written based on `lib.rs`, then converted to Anchor 0.30.1 NEW format:

- Root `address` field (not nested in metadata)
- `"pubkey"` type (not `"publicKey"`)
- `discriminator` arrays on all instructions (sha256 of `global:<snake_case_name>`, first 8 bytes)
- `discriminator` on all account types (sha256 of `account:<PascalCaseName>`, first 8 bytes)
- `writable`/`signer` booleans (not `isMut`/`isSigner`)
- `types[]` array must contain ALL account AND event struct definitions (BorshAccountsCoder looks them up there)
- systemProgram accounts need `address: "11111111111111111111111111111111"`

IDL file: `target/idl/agentmemory.json`

### Deployment

```bash
solana program deploy target/deploy/agentmemory.so --url devnet --with-compute-unit-price 10000
```

**NOT `anchor deploy`** (it parses IDL and chokes on format differences).

Cost: ~2.65 SOL for deployment. First attempt failed (122 write txns failed), succeeded on retry with compute unit price.

### Program ID Sync

After first build generates keypair:

```bash
PROGRAM_ID=$(solana address -k target/deploy/agentmemory-keypair.json)
```

Update in:
1. `lib.rs` (`declare_id!`)
2. `Anchor.toml` (all 3 sections)
3. IDL json (`address` field)

---

## Phase 2: Fix SDK/Tests/CLI

### The Big Mismatch

Original SDK/tests were written for a DIFFERENT contract interface. Key differences:

| SDK called | Contract actually has |
|---|---|
| `initialize(feePct, royaltyPct)` | `initializePlatform(treasury, platform_fee_bps, referral_fee_bps)` |
| `registerModule(6 params)` | `registerModule(4 params)` |
| `account.memoryModule` | `account.moduleMetadata` |
| PDA seed `"config"` | PDA seed `"platform_config"` |
| No agent needed for purchase | Agent PDA required |

### SDK Constructor (Anchor 0.30.1)

```typescript
// OLD (3-arg, broken):
this.program = new Program(idl, programId, this.provider);

// NEW (2-arg, works):
this.program = new Program(idlData, this.provider);
// reads program ID from idl.address field
```

Also: `program.account` property is typed as `AccountNamespace<Idl>` which doesn't know account names. Fix: type `program` as `any`.

### logDecision Timestamp Race Condition

On-chain: PDA seed includes `Clock::get()?.unix_timestamp.to_le_bytes()`
Client: Pre-computes PDA with `getBlockTime(getSlot())`

On localnet: works (near-zero latency)
On devnet: FAILS with ConstraintSeeds (error 2006) because time drifts

**Fix:** Use `blockTime + 1` offset and `skipPreflight: true`:

```typescript
const ts = blockTime + 1;
const [memoryLogPda] = this.getMemoryLogPDA(agentPda, ts);
const tx = await this.program.methods
  .logDecision(inputData, logicData)
  .accounts({...})
  .rpc({ skipPreflight: true });
```

### purchaseModule referrerWallet

Anchor 0.30.1 IDL doesn't handle optional accounts like newer versions. `referrerWallet` must ALWAYS be provided. When no referrer, pass buyer's own address:

```typescript
referrerWallet: referrer || this.provider.wallet.publicKey,
```

### macOS Resource Fork Issue

`solana-test-validator` fails with `._genesis.bin` error (macOS resource forks in tar archives).

Fix:
```bash
export COPYFILE_DISABLE=1
```
Run this before starting the validator.

### Tests

All 9 tests pass on local validator:

1. Initialize platform config
2. Initialize agent
3. Log a decision
4. Attest outcome
5. Prevent double attestation
6. Register memory module
7. Purchase with royalty distribution
8. Prevent duplicate purchase
9. Reject module with price too low

---

## Phase 3: On-Chain Proof Transactions

### All Devnet Transactions (LIVE)

**Platform Init:**
- Tx: `5dZk3gzqqhK17mopwcjNuqHCZYb2juThdNnraQN2H4PbbC3sAdJW4ajCbBcaipf6owwjNPm8ZQtZ48PgxBy5Yzc5`
- Treasury: `5wkiaNG9sVBhL9HTWAkt8MpGALhb5YhfjGPA3Lou6paS`, Fees: 500bps/500bps

**Agent Init (opus-libre-001):**
- Tx: `2FXQpRuL4KGdAhKx2n3Jv2eZzgazKaAqqHF6uWo2d92oqKjz38UYLzUxjMnDGSGKV2CaaUtTYwm1bzqPYh933nbM`

**Decision Log #1 (BTC trade):**
- Tx: `4Wy8VYvbLo2Xs3kFXSo1oagBn5ZJBFTygk4YMPBsfkxxGVvDoJ9S99oyfLfsK8KLKtNEb7eeeczwTpbDh5cGo43g`
- Memory: `2DB3dcQJ7pNHQ157muXFoTW9j5oqFeZv35Dv9i9vmELu`

**Attestation #1 (BTC profit):**
- Tx: `64HbTMbgovceFYiXNPuFkt6KonyfepxNC3HgsJzQWoopTGjoyV8BhfeEzDScrpEdsvfbYJCup4FTBncLEzN1y22B`
- Score: +10

**Decision Log #2 (ETH trade):**
- Tx: `5cfrQCxkbsHtghJa8NUTN6n9nPhRRqcdsPBd8Gpbj83KY4qQheWTvU2sud5iydh9vepJUSwGUJNnPAFyFfLLxSiH`
- Memory: `3YDaHaxhdKy2ZRGgK4kufBrSK2ctDUGiXJ5hTcPp32Sk`

**Attestation #2 (ETH profit):**
- Tx: `yWg8vm9968SHWXddnZQK4tiTJaXgzdeCytGTZAm6dFyM281EyYmbXYhzeRefkaiq2XixpQkwgbGM5mfy4gSj8Ho`
- Score: +15

**Decision Log #3 (SOL staking):**
- Tx: `tDYVWxBz7dvRuZacJufq8msNggWiBcbd2YA4PJtUn5Vr5xfpjJMszvRYtn7arPWjiBoofA65Saefp7HHHvYN4wB`
- Memory: `8B7Vy3DhGU7VhcapkNpb85JabH4ViGaWCfUiw8WQTnrK`

**Module Registration (bitemporal-v1):**
- Tx: `3fpLX2cVH9wcQxjLp8vKEhVXosp8nPsAsCPvyRHxcQdTm3mHo8A9hCjPGNz9YjLjLCGaRWQCb8Stcy8PY2LH7hpn`
- Price: 0.1 SOL, Royalty: 90%

**Module Registration (semantic-cache-v1):**
- Tx: `2o5ew3WRGYfESiEPYka5Junss9Mj8249GTjtubqHKBeasgkJ93e9Uz9tAYnE4pAVuWpf4guuoiJYgS64FVtkGJCz`
- Price: 0.05 SOL, Royalty: 85%

**Module Registration (rag-memory-v1):**
- Tx: `2Tj7s859isa3cZQ4gz75mYt2nVFwhXqSqDgB65Q4qSWZd4wfn6QQSTLebhUfqiaccK6Fr4ykttoT6UECRxwkbsBz`
- Price: 0.075 SOL, Royalty: 95%

**Module Purchase (bitemporal-v1):**
- Tx: `2zESXhRTLFq1a73r3u2kNwyPpLn1mYp8aMbe1GSNUhv2bwraBhpmsQEe96D7JriJQufg3Vk9BAHW9niw9YkVGaWQ`
- Sales: 1, Revenue: 0.1 SOL

### Agent Final State

- Agent: opus-libre-001
- Reputation: 25
- Total logs: 3
- Total attestations: 2

---

## Key Files

| File | Purpose |
|---|---|
| `programs/agentmemory/src/lib.rs` | Smart contract (637 LOC) |
| `target/idl/agentmemory.json` | Hand-written IDL (Anchor 0.30.1 new format) |
| `target/types/agentmemory.ts` | TypeScript types |
| `sdk/index.ts` | SDK client |
| `cli/agentmemory-cli.ts` | CLI tool |
| `tests/test.ts` | Test suite (9 tests) |
| `Anchor.toml` | Project config |
| `programs/agentmemory/Cargo.toml` | Rust dependencies |

---

## Lessons Learned

1. **Never use `anchor build` with anchor-lang 0.30.1 on modern Rust** - use `cargo-build-sbf` directly
2. **Never use `anchor deploy`** - use `solana program deploy` directly
3. **Anchor 0.30.1 NEW IDL format is completely different from old format** - discriminators, types array, pubkey type, writable/signer
4. **SBF target requires Rust 1.75-dev** - pin crates to compatible versions
5. **Cargo.lock v4 (Rust 1.88) incompatible with SBF build** - regenerate with older toolchain
6. **On devnet, timestamp-based PDAs need skipPreflight + offset** to handle latency
7. **Optional accounts in Anchor 0.30.1 aren't really optional in IDL** - always provide them
8. **macOS `COPYFILE_DISABLE=1` needed** for solana-test-validator
