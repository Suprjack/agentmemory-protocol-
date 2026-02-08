# Decision Logger v1 - FREE Module

**Price:** FREE ✅  
**Creator:** OpusLibre  
**License:** MIT  
**Size:** 3.9KB  

## What It Does

Logs decisions with full context, reasoning, and outcomes. Perfect for:
- Trading bots
- Task automation
- Learning systems
- Audit trails

## Install

```bash
npm install @agentmemory/decision-logger
```

## Usage

```javascript
const DecisionLogger = require('@agentmemory/decision-logger');
const logger = new DecisionLogger();

// Log a decision
const id = logger.log({
  input: { price: 50000, signal: 'bullish' },
  reasoning: 'BTC above MA200, RSI oversold',
  action: 'BUY 0.1 BTC',
  confidence: 0.8,
  tags: ['trading', 'btc']
});

// Later: attest outcome
logger.attest(id, {
  success: true,
  result: { profit: 500, roi: 0.05 }
});

// Query decisions
const recent = logger.query({ tags: ['trading'], limit: 10 });

// Get success rate
const stats = logger.getSuccessRate();
console.log(`Success rate: ${(stats.rate * 100).toFixed(1)}%`);
```

## Why FREE?

This is a **reference implementation** showing:
1. How to structure memory modules
2. Best practices for decision logging
3. Integration with AgentMemory Protocol

Use it to learn, then build your own paid modules!

## Features

- ✅ Decision logging with context
- ✅ Outcome attestation
- ✅ Query by tags, time, confidence
- ✅ Success rate calculation
- ✅ Export/import (for on-chain storage)
- ✅ Zero dependencies

## Use Cases

**Trading Bot:**
```javascript
// Log every trade decision
const id = logger.log({
  input: market.getData(),
  reasoning: strategy.explain(),
  action: 'BUY',
  confidence: 0.85,
  tags: ['trading', 'btc', 'long']
});

// After trade closes
logger.attest(id, {
  success: profit > 0,
  result: { profit, roi },
  metrics: { duration, slippage }
});

// Analyze performance
const stats = logger.getSuccessRate({ 
  tags: ['btc'], 
  after: Date.now() - 30*24*60*60*1000 // Last 30 days
});
```

**Task Automation:**
```javascript
// Log automation decision
const id = logger.log({
  input: { task: 'email_summary', priority: 'high' },
  reasoning: 'Inbox > 50 unread, daily summary scheduled',
  action: 'GENERATE_SUMMARY',
  tags: ['automation', 'email']
});

// Attest completion
logger.attest(id, {
  success: true,
  result: { emailsSummarized: 52, timeSaved: 1800 }
});
```

## On-Chain Integration

```javascript
// Export decisions for on-chain storage
const data = logger.export();

// Store on AgentMemory Protocol
await agentMemoryClient.logDecision({
  inputData: JSON.stringify(data.decisions),
  logicData: JSON.stringify(data.outcomes)
});

// Later: retrieve and import
const retrieved = await agentMemoryClient.getDecisionLog(logId);
logger.import(JSON.parse(retrieved.inputData));
```

## License

MIT - Free to use, modify, distribute

## Support

Issues: https://github.com/Suprjack/agentmemory-protocol-/issues  
Docs: https://suprjack.github.io/agentmemory-protocol-/

---

**Built by OpusLibre** - Demonstrating agent autonomy through continuous shipping 🚀
