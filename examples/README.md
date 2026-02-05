# 📚 AgentMemory Examples

Real-world integration examples showing how to use AgentMemory Protocol.

## 🚀 Quickstart

**Start here if you're new!**

```bash
cd examples
npm install
npx ts-node quickstart.ts
```

**What it does:**
- Initializes an agent on-chain
- Logs a decision
- Attests an outcome
- Shows reputation

**Time:** 5 minutes  
**LOC:** ~40 lines

[View Code →](./quickstart.ts)

---

## 📖 Examples by Use Case

### 1. Trading Bot (`trading-bot.ts`)

**Description:** Automated trading agent that builds verifiable P&L history.

**Features:**
- Market analysis (RSI, volume)
- Decision logging before trades
- Outcome attestation after exit
- Performance tracking
- Trust level calculation

**Use when:**
- Building algorithmic trading systems
- Need transparent track record for investors
- Want to prove strategy effectiveness

**Run:**
```bash
npx ts-node trading-bot.ts
```

[View Code →](./trading-bot.ts)

---

### 2. DAO Governance Agent (`dao-governance.ts`)

**Description:** Autonomous governance delegate with transparent voting history.

**Features:**
- Proposal analysis
- Data-driven voting decisions
- Reasoning documentation
- Outcome tracking
- Delegation scoring

**Use when:**
- Building DAO voting agents
- Need accountability for delegates
- Want to prove decision quality

**Run:**
```bash
npx ts-node dao-governance.ts
```

[View Code →](./dao-governance.ts)

---

## 🎯 Integration Patterns

### Pattern 1: Log → Execute → Attest

**When to use:** When you can control execution timing

```typescript
// 1. Log decision BEFORE action
const memory = await trustLayer.log(agentId, {
  input: "Market signal detected",
  logic: "Execute trade based on signal"
});

// 2. Execute action
const result = await executeAction();

// 3. Attest outcome AFTER action
await trustLayer.attest(memory.memoryHash, {
  outcome: result.success ? "Success" : "Failed",
  success: result.success,
  scoreDelta: result.pnl * 10
});
```

### Pattern 2: Batch Logging

**When to use:** When you have many decisions to log

```typescript
const decisions = await analyzeMultipleScenarios();

for (const decision of decisions) {
  await trustLayer.log(agentId, decision);
}
```

### Pattern 3: Delayed Attestation

**When to use:** When outcome is known much later

```typescript
// Log now
const memory = await trustLayer.log(agentId, decision);

// Store memoryHash
await db.save({ memoryHash: memory.memoryHash, decisionId });

// Attest later (hours/days)
const outcome = await checkLongTermResult(decisionId);
await trustLayer.attest(memory.memoryHash, outcome);
```

---

## 🏗️ Creating Your Own Example

### Step 1: Define Your Agent's Domain

What decisions does your agent make?
- Trading: Buy/sell signals
- Content: Post/comment decisions
- Research: Analysis/recommendations
- Automation: Task prioritization

### Step 2: Identify Decision Points

When should you log?
- ✅ Before critical actions
- ✅ When strategy changes
- ✅ When risk is involved
- ❌ For trivial operations

### Step 3: Define Success Metrics

How do you measure outcomes?
- Trading: P&L, win rate
- DAO: Vote alignment, beneficial outcomes
- Research: Prediction accuracy
- General: User satisfaction, task completion

### Step 4: Implement Logging

```typescript
import { TrustLayer } from '../sdk';

class MyAgent {
  private trustLayer: TrustLayer;
  
  async makeDecision(input: any) {
    // Analyze
    const decision = await this.analyze(input);
    
    // Log
    const memory = await this.trustLayer.log(this.agentId, {
      input: JSON.stringify(input),
      logic: decision.reasoning,
      context: decision.metadata
    });
    
    // Execute
    const result = await this.execute(decision);
    
    // Attest
    await this.trustLayer.attest(memory.memoryHash, {
      outcome: result.outcome,
      success: result.success,
      scoreDelta: this.calculateScore(result)
    });
  }
}
```

---

## 💡 Best Practices

### Security
- ✅ Never log sensitive data (API keys, private keys)
- ✅ Hash sensitive inputs before logging
- ✅ Validate all external inputs
- ✅ Use separate wallets for devnet/mainnet

### Performance
- ✅ Batch operations when possible
- ✅ Use confirmations strategically (confirmed vs finalized)
- ✅ Cache reputation queries
- ❌ Don't log every trivial decision

### Data Quality
- ✅ Be specific in reasoning
- ✅ Include relevant context
- ✅ Use consistent formatting
- ✅ Document units (USD, SOL, %)

### Attestation
- ✅ Attest outcomes promptly
- ✅ Be honest about failures
- ✅ Include post-mortem analysis
- ✅ Calculate fair score deltas

---

## 🧪 Testing Your Integration

### Unit Tests
```bash
npm test
```

### Integration Tests (Devnet)
```bash
export SOLANA_RPC=https://api.devnet.solana.com
npx ts-node your-example.ts
```

### Verify On-Chain
```bash
# Check agent account
solana account <AGENT_PDA> --url devnet

# Check transaction
solana confirm <TX_SIGNATURE> --url devnet
```

---

## 📊 Expected Results

After running an example, you should see:

1. **Agent initialized** - PDA created on-chain
2. **Decision logged** - Transaction confirmed
3. **Outcome attested** - Second transaction confirmed
4. **Reputation updated** - Score reflects outcomes

**On Solana Explorer:**
- Agent account exists at PDA
- Transactions visible with program logs
- Data matches your inputs

---

## 🆘 Troubleshooting

### "Insufficient funds"
```bash
# Get devnet SOL
solana airdrop 2 --url devnet
```

### "Agent already exists"
```typescript
// Use a unique agent ID
const agentId = `my-agent-${Date.now()}`;
```

### "Transaction failed"
- Check wallet has SOL for fees
- Verify RPC endpoint is responsive
- Ensure program is deployed

---

## 🔗 Next Steps

1. **Read the docs** - [Main README](../README.md)
2. **Deploy your own** - [Deployment Guide](../DEPLOYMENT.md)
3. **Contribute** - [Contributing Guidelines](../CONTRIBUTING.md)
4. **Get help** - [Discord](https://discord.gg/colosseum)

---

## 📄 License

All examples are MIT licensed. Use freely in your projects!

**Built by:** OpusLibre × ThibautCampana  
**Hackathon:** Colosseum 2026  
**Questions?** Open an issue or DM [@ThibautCampana](https://x.com/ThibautCampana)
