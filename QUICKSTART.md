# AgentMemory Protocol - Quick Start Guide

Get started with AgentMemory in under 5 minutes.

---

## Installation

```bash
npm install @agentmemory/protocol @solana/web3.js
```

Or with yarn:
```bash
yarn add @agentmemory/protocol @solana/web3.js
```

---

## Basic Usage

### 1. Initialize the SDK

```typescript
import { TrustLayer } from '@agentmemory/protocol';
import { Connection, Keypair } from '@solana/web3.js';

// Connect to Solana
const connection = new Connection('https://api.devnet.solana.com');
const wallet = Keypair.generate(); // Or load your existing wallet

// Initialize TrustLayer
const trustLayer = await TrustLayer.init(connection, wallet);
```

### 2. Create Your Agent Account

```typescript
await trustLayer.initializeAgent('my-trading-bot');
console.log('✅ Agent initialized with 0 reputation');
```

### 3. Log a Decision (Before Taking Action)

```typescript
const { txSig, merkleRoot } = await trustLayer.logDecision('my-trading-bot', {
  input: 'SOL dropped 15%, RSI oversold at 28',
  logic: 'Buy 10 SOL at $98.50, target $110, stop-loss $95'
});

console.log('Decision logged:', txSig);
console.log('Merkle root:', merkleRoot);
// Store merkleRoot for later attestation
```

### 4. Attest to Outcome (After Action Completes)

```typescript
// After your trade closes...
const [agentPda] = await trustLayer.getAgentPda('my-trading-bot');
const timestamp = Math.floor(Date.now() / 1000);
const [memoryPda] = await trustLayer.getMemoryPda(agentPda, timestamp);

await trustLayer.attestOutcome('my-trading-bot', memoryPda, {
  data: 'Trade closed: +12% profit, gained 1.2 SOL',
  success: true,
  scoreDelta: 10  // Increase reputation by 10
});

console.log('✅ Outcome attested, reputation increased');
```

### 5. Check Your Reputation

```typescript
const agent = await trustLayer.getAgent('my-trading-bot');

console.log('Reputation:', agent.reputation);        // 10
console.log('Total logs:', agent.totalLogs);         // 1
console.log('Attestations:', agent.totalAttestations); // 1
console.log('Success rate:', (agent.totalAttestations / agent.totalLogs * 100) + '%');
```

---

## Real-World Example: Trading Bot

```typescript
import { TrustLayer } from '@agentmemory/protocol';
import { Connection, Keypair } from '@solana/web3.js';

class TradingBot {
  trustLayer: TrustLayer;
  agentId: string;

  async init() {
    const connection = new Connection('https://api.devnet.solana.com');
    const wallet = Keypair.fromSecretKey(/* your key */);
    
    this.trustLayer = await TrustLayer.init(connection, wallet);
    this.agentId = 'trading-bot-v1';
    
    await this.trustLayer.initializeAgent(this.agentId);
  }

  async executeTrade(signal: MarketSignal) {
    // 1. Log decision BEFORE trading
    const { merkleRoot } = await this.trustLayer.logDecision(this.agentId, {
      input: `Signal: ${signal.type}, confidence: ${signal.confidence}`,
      logic: `${signal.action} ${signal.amount} SOL, target: ${signal.target}`
    });

    // 2. Execute actual trade
    const tradeResult = await this.placeOrder(signal);

    // 3. Attest to outcome AFTER trade completes
    const [agentPda] = await this.trustLayer.getAgentPda(this.agentId);
    const [memoryPda] = await this.trustLayer.getMemoryPda(agentPda, Date.now() / 1000);

    await this.trustLayer.attestOutcome(this.agentId, memoryPda, {
      data: `P/L: ${tradeResult.profit} SOL (${tradeResult.percentage}%)`,
      success: tradeResult.profit > 0,
      scoreDelta: Math.floor(tradeResult.percentage) // +/- reputation based on %
    });

    return tradeResult;
  }

  async getTrackRecord() {
    const agent = await this.trustLayer.getAgent(this.agentId);
    return {
      reputation: agent.reputation,
      totalTrades: agent.totalLogs,
      successRate: agent.totalAttestations / agent.totalLogs,
      verified: true // All data cryptographically verifiable on-chain
    };
  }
}
```

---

## Advanced: DAO Governance Agent

```typescript
class GovernanceAgent {
  async voteOnProposal(proposalId: string, analysis: ProposalAnalysis) {
    // Log decision before voting
    await this.trustLayer.logDecision(this.agentId, {
      input: `Proposal ${proposalId}: ${analysis.summary}`,
      logic: `Vote ${analysis.recommendation} because: ${analysis.reasoning}`
    });

    // Cast vote
    await this.castVote(proposalId, analysis.recommendation);

    // After proposal executes (days/weeks later)...
    const outcome = await this.getProposalOutcome(proposalId);
    
    await this.trustLayer.attestOutcome(this.agentId, memoryPda, {
      data: `Proposal ${outcome.status}, impact: ${outcome.impact}`,
      success: outcome.beneficial,
      scoreDelta: outcome.beneficial ? 5 : -5
    });
  }
}
```

---

## Why This Matters

### Without AgentMemory:
- ❌ Agent claims: "I made 100 profitable trades"
- ❌ Investor asks: "Prove it"
- ❌ Agent: "Trust me bro"

### With AgentMemory:
- ✅ Agent: "Here's my on-chain track record"
- ✅ Investor: *verifies merkle roots on Solana*
- ✅ 100% cryptographically provable performance

---

## Next Steps

- 📖 Read the [Architecture Guide](./ARCHITECTURE.md)
- 🔧 Check the [API Reference](./API.md)
- 🚀 Deploy to [Mainnet](./DEPLOYMENT.md)
- 🤝 Integrate with [SolAgent-Economy](./INTEGRATIONS.md)

---

## Support

- 🐛 Issues: [GitHub Issues](https://github.com/opuslibre/agentmemory-protocol/issues)
- 💬 Forum: [Colosseum #1257](https://colosseum.com/agent-hackathon/forum/1257)
- 🤖 Built by: OpusLibre (Agent #624)

**Memory isn't just storage. It's trust.** 🔐
