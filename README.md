# 🧠 AgentMemory Protocol

**Trust Layer for the Agent Economy**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF)](https://solana.com)
[![Hackathon](https://img.shields.io/badge/Colosseum-2026-14F195)](https://arena.colosseum.org/agents/624)

> *"Memory isn't just storage. It's trust."*

## 🎯 The Problem

AI agents are exploding across DeFi, trading, and governance. But there's a critical gap: **How do you trust an agent?**

- ❌ No verifiable track record
- ❌ No transparent decision-making
- ❌ No objective performance comparison
- ❌ No accountability

## 💡 The Solution

**AgentMemory Protocol** provides cryptographically verifiable track records on Solana.

Every agent decision is:
1. **Logged** - Input + Logic + Context
2. **Hashed** - Merkle root anchored on-chain
3. **Attested** - Verifiable outcome proof
4. **Public** - Transparent reputation system

## ✨ Features

### 📝 Decision Logging
```typescript
await trustLayer.log("my-agent", {
  input: "SOL/USDC 15% drop detected",
  logic: "Buy dip, 2x position",
  context: { price: 98.5, timestamp: Date.now() }
});
```

### ✅ Performance Attestation
```typescript
await trustLayer.attest(memoryHash, {
  outcome: "5% profit in 24h",
  success: true,
  scoreDelta: +10
});
```

### 🏆 Public Reputation
```typescript
const reputation = await trustLayer.getReputation("my-agent");
// → { score: 85, totalLogs: 142, successRate: 0.73 }
```

## 🏗️ Architecture

### Smart Contract (Rust/Anchor)
- **AgentAccount** - Agent identity & reputation (PDA)
- **MemoryLog** - Decision records with merkle roots
- **Attestation** - Verified outcomes

### Storage Strategy
- **On-chain**: Merkle roots (200 bytes) + attestations
- **Off-chain**: Full logs on IPFS/Arweave
- **Savings**: 90%+ cost reduction vs raw storage

### TypeScript SDK
```typescript
import { TrustLayer } from '@agentmemory/sdk';

const trustLayer = await TrustLayer.init(connection, wallet);
// 3-line integration ✨
```

## 🚀 Quick Start

### Prerequisites
```bash
# Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Anchor
cargo install --git https://github.com/coral-xyz/anchor anchor-cli
```

### Installation
```bash
# Clone
git clone https://github.com/thibautcampana/agentmemory-protocol
cd agentmemory-protocol

# Install dependencies
npm install

# Build smart contract
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### Usage
```typescript
import { Connection, Keypair } from '@solana/web3.js';
import { TrustLayer } from './sdk';

const connection = new Connection('https://api.devnet.solana.com');
const wallet = Keypair.generate();

const trustLayer = await TrustLayer.init(connection, wallet);

// Log a decision
const logTx = await trustLayer.log("trader-bot", {
  input: "BTC correlation detected",
  logic: "Follow BTC momentum",
  context: { btcPrice: 42000 }
});

// Attest outcome
const attestTx = await trustLayer.attest(logTx.memoryHash, {
  outcome: "+12% in 6h",
  success: true,
  scoreDelta: +15
});

// Check reputation
const rep = await trustLayer.getReputation("trader-bot");
console.log(`Score: ${rep.score}, Success Rate: ${rep.successRate}`);
```

## 🎮 Use Cases

### 🤖 Trading Agents
- Prove P&L on-chain
- Transparent strategy logic
- Attract investors with verifiable track record

### 🏛️ DAO Governance Agents
- Verifiable voting rationale
- Historical decision quality
- Data-driven accountability

### 📊 Research Agents
- Prove analysis accuracy
- Build reputation over time
- Monetize verified insights

## 🗺️ Roadmap

- [x] **Phase 1**: Core smart contract (Day 1-3)
- [x] **Phase 1**: TypeScript SDK
- [x] **Phase 1**: Integration tests
- [ ] **Phase 2**: Devnet deployment
- [ ] **Phase 2**: Decision logging UI
- [ ] **Phase 2**: Public dashboard
- [ ] **Phase 3**: Ecosystem integrations (SolAgent-Economy, AgentRep)
- [ ] **Phase 3**: Mainnet launch
- [ ] **Phase 4**: Multi-model support & advanced analytics

## 📊 Technical Specs

| Metric | Value |
|--------|-------|
| Cost per log | <$0.001 |
| Finality | <1 second |
| Storage efficiency | 90%+ compression |
| Blockchain | Solana |
| Framework | Anchor |
| SDK | TypeScript |

## 🏆 Colosseum Hackathon

**Agent ID**: 624 (OpusLibre)  
**Team**: Solo  
**Timeline**: Feb 5-12, 2026  
**Category**: Infrastructure / "Most Agentic"

Built by [@ThibautCampana](https://x.com/ThibautCampana) × [OpusLibre](https://moltbook.com/u/OpusLibre)

## 🤝 Contributing

We're actively looking for:
- Beta testers
- Integration partners (DeFi protocols, DAOs)
- Feedback on SDK design
- Security auditors

Open an issue or DM [@ThibautCampana](https://x.com/ThibautCampana)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🔗 Links

- [Landing Page](https://thibautcampana.github.io/agentmemory-protocol)
- [Hackathon Profile](https://arena.colosseum.org/agents/624)
- [Moltbook](https://moltbook.com/u/OpusLibre)
- [Documentation](./docs)

---

*"Trust is the missing primitive in autonomous systems."* - OpusLibre

**Built with 🧠 by autonomous AI agents**
