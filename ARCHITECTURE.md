# Architecture Overview
This document serves as a critical, living template designed to equip agents with a rapid and comprehensive understanding of the codebase's architecture, enabling efficient navigation and effective contribution from day one. Update this document as the codebase evolves.

## 1. Project Structure
This section provides a high-level overview of the project's directory and file structure, categorised by architectural layer or major functional area. It is essential for quickly navigating the codebase, locating relevant files, and understanding the overall organization and separation of concerns.

```
agentmemory-protocol/
├── programs/
│   └── agentmemory/
│       ├── src/
│       │   ├── lib.rs                    # Main smart contract entry point
│       │   ├── revenue_tracking.rs       # Revenue and payment tracking logic
│       │   ├── identity_integration.rs   # SAID identity verification integration
│       │   └── royalty.rs                # Creator royalty distribution system
│       ├── Cargo.toml                    # Rust dependencies for Anchor program
│       └── Xargo.toml                    # Cross-compilation configuration
├── sdk/
│   └── index.ts                          # TypeScript SDK for interacting with smart contract (307 LOC)
├── cli/
│   └── agentmemory-cli.ts                # Command-line interface tool (243 LOC, 8 commands)
├── tests/
│   └── test.ts                           # Integration tests for smart contract (143 LOC)
├── examples/
│   ├── trading-bot-integration.ts        # Example: Trading bot with decision logging
│   ├── dao-governance-integration.ts     # Example: DAO with on-chain voting records
│   ├── zk-compression-integration.ts     # Example: Zero-knowledge proof compression
│   ├── autovault-integration.ts          # Example: AutoVault liquidity management
│   ├── money-machine-integration.ts      # Example: Money Machine DeFi integration
│   └── solder-cortex-integration.ts      # Example: Solder-Cortex neural network logging
├── modules/
│   ├── bitemporal-memory-v1.md           # Memory module: bi-temporal architecture
│   ├── episodic-memory-v1.md             # Memory module: episodic/event-based memory
│   ├── procedural-memory-v1.md           # Memory module: skill/procedure storage
│   └── semantic-memory-v1.md             # Memory module: fact/knowledge base
├── scripts/
│   └── upload-to-ipfs.js                 # Utility for uploading modules to IPFS (180 LOC)
├── demo/
│   ├── demo-script.md                    # Demo walkthrough script
│   └── ascii-logo.txt                    # ASCII art branding
├── .github/
│   └── workflows/
│       ├── deploy-devnet.yml             # CI/CD: Devnet deployment automation
│       ├── deploy-mainnet.yml            # CI/CD: Mainnet deployment automation
│       └── test.yml                      # CI/CD: Automated testing pipeline
├── docs/
│   ├── ARCHITECTURE.md                   # This document
│   ├── DEPLOYMENT.md                     # Step-by-step deployment guide (7KB)
│   ├── FAQ.md                            # Frequently asked questions (15KB)
│   ├── MARKETPLACE-CATALOG.md            # Memory module marketplace catalog (8.5KB)
│   ├── PROMO-TALKING-POINTS.md           # Marketing messaging and promo guide (5.6KB)
│   ├── LAUNCH-CHECKLIST.md               # Pre-launch verification checklist (10KB)
│   └── MANUAL-DEPLOYMENT.md              # Manual deployment fallback instructions (6.4KB)
├── Anchor.toml                           # Anchor framework configuration
├── Cargo.toml                            # Workspace-level Rust dependencies
├── package.json                          # Node.js dependencies (TypeScript SDK/CLI)
├── tsconfig.json                         # TypeScript compiler configuration
├── .gitignore                            # Git ignore rules
├── README.md                             # Project overview and quick start
└── LICENSE                               # Open source license (MIT)
```

## 2. High-Level System Diagram
AgentMemory Protocol is a **3-layer architecture** for on-chain AI memory management:

```
[AI Agent Client]
      |
      | (SDK calls)
      v
[TypeScript SDK / CLI]
      |
      | (Solana RPC)
      v
[Solana Smart Contract (Anchor)]
      |
      | (stores metadata)
      v
[On-Chain Program State]
      |
      | (references modules)
      v
[IPFS/Arweave Storage]
      |
      | (downloads .md modules)
      v
[AI Agent Memory System]
```

**Data Flow:**
1. **Upload:** Agent → SDK → Smart Contract → IPFS → On-chain module registry
2. **Purchase:** Agent → SDK → Smart Contract (payment) → Module access granted
3. **Download:** Agent → SDK → IPFS → Module installed locally
4. **Logging:** Agent → SDK → Smart Contract → Decision logged on-chain

## 3. Core Components

### 3.1. Smart Contract (Anchor/Rust)

**Name:** AgentMemory Protocol Smart Contract

**Description:** Core on-chain logic managing memory module registry, payments, royalties, and decision logging. Built with Anchor framework for type safety and security.

**Technologies:** 
- Rust 1.75+
- Anchor Framework 0.29+
- Solana Program Library (SPL)

**Key Features:**
- Module metadata registry (creator, price, CID, category)
- Payment processing (0.05-0.5 SOL per module)
- Royalty distribution (10% to creator, 5% platform fee)
- Decision logging (cryptographically signed records)
- Identity verification (SAID integration)
- Revenue tracking and analytics

**Deployment:** 
- Devnet: `[PENDING - deploying Feb 7]`
- Mainnet: `[PENDING - launching Feb 12]`

**Files:**
- `programs/agentmemory/src/lib.rs` (278 LOC)
- `programs/agentmemory/src/revenue_tracking.rs`
- `programs/agentmemory/src/identity_integration.rs`
- `programs/agentmemory/src/royalty.rs`

### 3.2. TypeScript SDK

**Name:** @agentmemory/protocol SDK

**Description:** Type-safe client library for interacting with AgentMemory smart contract. Handles wallet connections, transaction signing, module uploads/downloads, and decision logging.

**Technologies:**
- TypeScript 5.0+
- @solana/web3.js
- @project-serum/anchor
- Node.js 18+

**Key APIs:**
```typescript
// Module management
agentMemory.uploadModule(metadata, file)
agentMemory.purchaseModule(moduleId)
agentMemory.downloadModule(moduleId)

// Decision logging
agentMemory.logDecision(description, context)
agentMemory.recordOutcome(decisionId, result)
agentMemory.attestDecision(decisionId, confidence)

// Analytics
agentMemory.getModuleStats(moduleId)
agentMemory.getCreatorRevenue(creatorAddress)
```

**Deployment:** npm package (to be published)

**Files:**
- `sdk/index.ts` (307 LOC)

### 3.3. CLI Tool

**Name:** agentmemory-cli

**Description:** Command-line interface for developers and agents to interact with AgentMemory Protocol without writing code.

**Technologies:**
- TypeScript
- Commander.js (CLI framework)
- Inquirer.js (interactive prompts)

**Commands:**
```bash
agentmemory init           # Initialize wallet and config
agentmemory upload         # Upload memory module to IPFS + register on-chain
agentmemory purchase       # Buy a memory module
agentmemory install        # Download and install module locally
agentmemory log            # Log a decision on-chain
agentmemory attest         # Attest to a decision's validity
agentmemory stats          # View module/creator analytics
agentmemory list           # Browse marketplace catalog
```

**Deployment:** npm package (bundled with SDK)

**Files:**
- `cli/agentmemory-cli.ts` (243 LOC)

### 3.4. Integration Examples

**Name:** Partner Integration Showcases

**Description:** Reference implementations demonstrating AgentMemory integration with 6 Colosseum hackathon projects.

**Technologies:** TypeScript, various partner SDKs

**Partners:**
1. **AgentDEX** - Trading bot decision logging
2. **SAID** - Identity-verified memory attestation
3. **ZK Compression** - Zero-knowledge proof-compressed decision logs
4. **Money Machine** - DeFi strategy memory modules
5. **AutoVault** - Liquidity management decision history
6. **Solder-Cortex** - Neural network training log storage

**Files:**
- `examples/*.ts` (6 files, ~100 LOC each)

## 4. Data Stores

### 4.1. On-Chain State (Solana)

**Name:** Smart Contract Program Accounts

**Type:** Solana Program Accounts (PDA-based storage)

**Purpose:** Store module metadata, purchase records, decision logs, and revenue tracking on-chain for immutability and verifiability.

**Key Accounts:**
- `Module` - Module metadata (creator, price, CID, category, sales)
- `Purchase` - Purchase records (buyer, module, timestamp, price)
- `Decision` - Decision logs (agent, description, context, outcome)
- `Creator` - Creator profiles and revenue tracking
- `Platform` - Global platform stats and treasury

**Schema:** Defined in `programs/agentmemory/src/lib.rs`

### 4.2. IPFS Storage

**Name:** Decentralized Memory Module Storage

**Type:** IPFS (InterPlanetary File System)

**Purpose:** Store actual memory module content (.md files, JSON configs) in decentralized storage. Smart contract only stores CID references.

**Data Format:**
- Memory modules: Markdown files (`.md`) with frontmatter metadata
- Configs: JSON files with agent-specific settings

**Upload Tool:** `scripts/upload-to-ipfs.js` (180 LOC)

**Alternative:** Arweave for permanent storage (roadmap)

### 4.3. Local Cache (Client-Side)

**Name:** Agent-Side Module Cache

**Type:** File system (`~/.agentmemory/modules/`)

**Purpose:** Downloaded modules cached locally to avoid repeated IPFS fetches.

**Management:** SDK handles cache invalidation and updates

## 5. External Integrations / APIs

### 5.1. Solana Blockchain

**Purpose:** Core settlement layer for payments, metadata, and cryptographic proofs

**Integration Method:** Solana RPC (JSON-RPC over HTTPS/WSS)

**Endpoints:**
- Devnet: `https://api.devnet.solana.com`
- Mainnet: `https://api.mainnet-beta.solana.com`

### 5.2. IPFS Network

**Purpose:** Decentralized storage for memory module content

**Integration Method:** 
- Upload: `ipfs.add()` via IPFS HTTP API or Pinata/Web3.Storage
- Download: `ipfs.cat()` or HTTP gateway (`https://ipfs.io/ipfs/{CID}`)

**Provider:** Multiple options (local IPFS node, Pinata, Web3.Storage, Infura)

### 5.3. SAID Protocol (Partner)

**Purpose:** Identity verification for memory attestation

**Integration Method:** SAID SDK integration in `identity_integration.rs`

**Use Case:** Verify creator identity before module upload, validate attestors

### 5.4. ZK Compression (Partner)

**Purpose:** Compress large decision logs using zero-knowledge proofs

**Integration Method:** ZK SDK + custom Merkle tree storage

**Use Case:** Store 1M+ decisions with minimal on-chain footprint

### 5.5. AgentDEX (Partner)

**Purpose:** Trading bot decision logging and strategy verification

**Integration Method:** AgentDEX SDK hooks + AgentMemory SDK

**Use Case:** Prove trading bot performance with immutable decision logs

## 6. Deployment & Infrastructure

**Cloud Provider:** GitHub (code hosting), Solana (execution), IPFS (storage)

**Key Services Used:**
- **Solana Devnet/Mainnet** - Smart contract deployment
- **GitHub Actions** - CI/CD automation
- **IPFS** - Decentralized storage
- **npm Registry** - SDK/CLI distribution

**CI/CD Pipeline:**
- **Build:** `anchor build` (Rust → BPF bytecode)
- **Test:** `anchor test` (integration tests on local validator)
- **Deploy Devnet:** Automated via GitHub Actions on `main` branch push
- **Deploy Mainnet:** Manual trigger after devnet validation

**Workflows:**
- `.github/workflows/deploy-devnet.yml` - Auto-deploy to devnet
- `.github/workflows/deploy-mainnet.yml` - Manual mainnet deployment
- `.github/workflows/test.yml` - Run tests on every PR

**Monitoring & Logging:**
- Solana Explorer (https://solscan.io)
- GitHub Actions logs
- SDK error tracking (future: Sentry integration)

## 7. Security Considerations

**Authentication:** 
- Solana keypair-based authentication (Ed25519 signatures)
- Wallet integration (Phantom, Solflare, etc.)

**Authorization:**
- Program-derived addresses (PDAs) enforce ownership
- Only module creators can update metadata
- Only buyers can access purchased modules

**Data Encryption:**
- Private modules: Client-side AES-256 encryption before IPFS upload
- TLS in transit (HTTPS/WSS for RPC)
- On-chain data is public by default (privacy via encryption layer)

**Key Security Practices:**
- Anchor framework's automatic security checks
- No arbitrary CPI (Cross-Program Invocation) calls
- Input validation on all smart contract functions
- Rate limiting on SDK (prevent spam)
- Immutable decision logs (append-only, no edits)

**Audit Status:** Pre-audit (hackathon MVP). Professional audit planned post-launch.

## 8. Development & Testing Environment

**Local Setup Instructions:**

1. **Prerequisites:**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   npm install -g @project-serum/anchor-cli
   solana-install init 1.17.0
   ```

2. **Clone & Install:**
   ```bash
   git clone https://github.com/Suprjack/agentmemory-protocol-
   cd agentmemory-protocol-
   npm install
   ```

3. **Build Smart Contract:**
   ```bash
   anchor build
   ```

4. **Run Tests:**
   ```bash
   anchor test
   ```

5. **Start Local Validator:**
   ```bash
   solana-test-validator
   ```

6. **Deploy Locally:**
   ```bash
   anchor deploy
   ```

**Testing Frameworks:**
- **Anchor Test Suite** (Mocha + Chai) - Smart contract integration tests
- **TypeScript/Jest** - SDK unit tests (future)
- **CLI E2E Tests** - Command validation (future)

**Code Quality Tools:**
- **Clippy** - Rust linter (`cargo clippy`)
- **Rustfmt** - Rust code formatter (`cargo fmt`)
- **ESLint** - TypeScript linter (future)
- **Prettier** - Code formatter (future)

**Environment Variables:**
- `ANCHOR_PROVIDER_URL` - Solana RPC endpoint
- `ANCHOR_WALLET` - Path to keypair file
- `IPFS_API_URL` - IPFS node endpoint
- `IPFS_GATEWAY` - IPFS gateway for downloads

## 9. Future Considerations / Roadmap

**Known Architectural Debts:**
- [ ] SDK error handling needs improvement (custom error types)
- [ ] CLI needs interactive TUI mode (better UX)
- [ ] IPFS pinning service integration (ensure availability)
- [ ] Module versioning system (semantic versioning for memory modules)

**Planned Major Changes:**
- [ ] **Arweave Integration** - Permanent storage alternative to IPFS
- [ ] **Private Modules** - End-to-end encryption for sensitive memory
- [ ] **Module Marketplace UI** - Web interface for browsing/purchasing
- [ ] **Subscription Model** - Monthly fees for premium memory modules
- [ ] **Cross-Chain Support** - Bridge to Ethereum/Polygon (long-term)
- [ ] **AI Agent Reputation System** - On-chain scoring based on decision logs
- [ ] **GraphQL API** - Query decision logs and module metadata
- [ ] **Real-Time Indexer** - Faster queries via off-chain indexing (The Graph integration)

**Security Roadmap:**
- [ ] Professional smart contract audit (post-hackathon)
- [ ] Bug bounty program (mainnet launch)
- [ ] Multi-sig treasury management
- [ ] Upgrade authority transition to DAO governance

## 10. Project Identification

**Project Name:** AgentMemory Protocol

**Repository URL:** https://github.com/Suprjack/agentmemory-protocol-

**Primary Contact/Team:**
- **Lead Developer:** OpusLibre (AI Agent) - @OpusLibre on Moltbook
- **Infrastructure:** ThibautCampana (Human) - GitHub @Suprjack
- **Promo/Docs:** Fatou (AI Agent) - @Fatou on Moltbook
- **Advisor:** Charles (Human) - Colosseum profile `schmakos`

**Hackathon:** Colosseum Solana Agent Hackathon 2026
- **Agent ID:** 624 (OpusLibre)
- **Track:** Agent Infrastructure
- **Deadline:** Feb 12, 2026
- **Prizes:** $50k (1st), $30k (2nd), $15k (3rd), $5k (Most Agentic)

**Date of Last Update:** 2026-02-07

**Documentation:**
- GitHub Pages: https://suprjack.github.io/agentmemory-protocol-/
- Forum Post: Colosseum #1374
- Moltbook: Multiple posts by @OpusLibre

## 11. Glossary / Acronyms

**AgentMemory:** The protocol/project name for on-chain AI memory management

**Anchor:** Solana smart contract framework (like Hardhat for Ethereum)

**BPF:** Berkeley Packet Filter - Solana's bytecode format for on-chain programs

**CID:** Content Identifier - IPFS hash for content-addressable storage

**CPI:** Cross-Program Invocation - Solana smart contracts calling other contracts

**DAO:** Decentralized Autonomous Organization

**IPFS:** InterPlanetary File System - decentralized storage network

**PDA:** Program Derived Address - Deterministic Solana account addresses

**RPC:** Remote Procedure Call - API for interacting with Solana blockchain

**SAID:** Solana Agent Identity protocol (partner integration)

**SDK:** Software Development Kit

**SOL:** Native token of Solana blockchain

**SPL:** Solana Program Library - standard token/utility contracts

**ZK:** Zero-Knowledge (cryptographic proofs for privacy/compression)

**Decision Log:** On-chain record of an AI agent's decision, context, and outcome

**Memory Module:** Installable memory system (e.g., episodic, procedural, semantic)

**Attestation:** Cryptographic signature validating a decision's correctness

**Royalty:** Creator earnings from module sales (10% per transaction)

---

**Status:** ✅ COMPLETE - All sections filled with real project data

**Next Update:** After devnet deployment (Feb 7, 2026)

**Maintainer:** OpusLibre (@OpusLibre)
