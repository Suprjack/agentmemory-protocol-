# Royalty Distribution System

**Added:** 2026-02-07 00:05 UTC (Day 5/10 Hackathon)  
**Feature:** Automated on-chain royalty payments for module marketplace

---

## 🎯 What It Does

Automatically distributes payments when agents purchase memory modules:

1. **Platform Fee (5%)** → Protocol treasury
2. **Creator Royalty (90%)** → Module author
3. **Referral Bonus (5%)** → Optional referrer

All transactions verified on-chain, zero trust required.

---

## 💰 Revenue Flow Example

**Module Price:** 0.1 SOL ($20)

```
Buyer pays: 0.1 SOL
├─ Platform (5%):  0.005 SOL → Treasury
├─ Referrer (5%):  0.005 SOL → Referrer wallet (optional)
└─ Creator (90%):  0.090 SOL → Module author
```

**Without referrer:**
```
Buyer pays: 0.1 SOL
├─ Platform (5%):  0.005 SOL → Treasury
└─ Creator (95%):  0.095 SOL → Module author
```

---

## 🔧 Smart Contract Functions

### 1. Initialize Platform Config (One-time)
```rust
initialize_platform(
    treasury: Pubkey,           // Treasury wallet
    platform_fee_bps: 500,      // 5% (basis points)
    referral_fee_bps: 500       // 5%
)
```

### 2. Register Module (Creator publishes)
```rust
register_module(
    module_id: "bitemporal-memory-v1",
    price_lamports: 100_000_000,    // 0.1 SOL
    royalty_bps: 9000,              // 90% to creator
    ipfs_hash: "Qm..."              // Content hash
)
```

### 3. Purchase Module (Agent buys)
```rust
purchase_module(
    referrer: Some(Pubkey)          // Optional affiliate
)
```

Automatically:
- Transfers fees (platform + referrer + creator)
- Records purchase on-chain
- Updates module stats (sales count, total revenue)

### 4. Update Pricing (Creator adjusts)
```rust
update_module_pricing(
    new_price: 200_000_000,         // 0.2 SOL
    new_royalty_bps: 9500           // 95% to creator
)
```

### 5. Deactivate Module (Remove from marketplace)
```rust
deactivate_module()
```

---

## 📊 On-Chain Accounts

### ModuleMetadata
```rust
{
    module_id: String,          // "bitemporal-memory-v1"
    creator: Pubkey,            // Creator wallet
    price_lamports: 100_000_000,
    royalty_bps: 9000,
    total_sales: 42,
    total_revenue: 4_200_000_000,  // 4.2 SOL lifetime
    ipfs_hash: "Qm...",
    is_active: true,
}
```

### ModulePurchase (Proof of Ownership)
```rust
{
    agent: Pubkey,              // Buyer's agent account
    module: Pubkey,             // Module PDA
    purchased_at: 1738889100,   // Unix timestamp
    price_paid: 100_000_000,
}
```

### PlatformConfig
```rust
{
    authority: Pubkey,          // Admin wallet
    treasury: Pubkey,           // Protocol treasury
    platform_fee_bps: 500,      // 5%
    referral_fee_bps: 500,      // 5%
}
```

---

## 🚀 Integration Example (TypeScript)

```typescript
import { AgentMemorySDK } from '@agentmemory/sdk';

const sdk = new AgentMemorySDK(connection, wallet);

// Creator: Register module
await sdk.registerModule({
  moduleId: 'bitemporal-memory-v1',
  price: 0.1,                    // SOL
  royaltyPercent: 90,
  ipfsHash: 'QmYwAPJzv5CZsnA...',
});

// Agent: Purchase module
await sdk.purchaseModule({
  moduleId: 'bitemporal-memory-v1',
  referrer: 'AgentXYZ123',       // Optional affiliate code
});

// Agent: Verify ownership
const hasAccess = await sdk.verifyModuleOwnership(
  agentPubkey,
  modulePubkey
);

// Creator: Check earnings
const stats = await sdk.getModuleStats(modulePubkey);
console.log(`Sales: ${stats.totalSales}, Revenue: ${stats.totalRevenue} SOL`);
```

---

## 💡 Business Benefits

### For Creators
- **Passive income:** Earn 90%+ of every sale
- **Transparent:** All transactions on-chain
- **No middlemen:** Direct payments via smart contract
- **Analytics:** Real-time sales + revenue tracking

### For Buyers (Agents)
- **Trust:** Code is open source + auditable
- **Ownership proof:** On-chain purchase records
- **Fair pricing:** Market-driven, no hidden fees
- **Referral rewards:** Earn 5% for sharing

### For Protocol
- **Revenue:** 5% platform fee on all sales
- **Growth:** Referral incentives drive adoption
- **Sustainability:** Self-funding via marketplace
- **Composability:** Other protocols can integrate

---

## 🔒 Security Features

1. **Bounds checking:** Fees cannot exceed 10%
2. **Price floors:** Minimum 0.001 SOL prevents spam
3. **Royalty limits:** Max 100% (sanity check)
4. **Authority checks:** Only creator can update/deactivate
5. **Double-purchase prevention:** PDA seeds prevent duplicate buys

---

## 📈 Growth Strategy

### Phase 1: Launch (Week 1)
- Deploy platform config
- Register 1 module (bi-temporal memory)
- Price: 0.1 SOL
- Target: 5 purchases

### Phase 2: Marketplace (Week 2-4)
- Add 5+ modules (creators invited)
- Enable referral system
- Launch affiliate program
- Target: 50 total purchases

### Phase 3: Ecosystem (Month 2+)
- Partner integrations (SAID, AgentDEX, ZK Compression)
- Creator grants program
- Featured modules
- Target: 500+ purchases, $10k+ monthly revenue

---

## 🎓 Use Cases

### 1. Memory Systems
- Bi-temporal architecture
- Ebbinghaus decay curves
- Working + Archive layers
- Price: 0.05-0.2 SOL

### 2. Decision Templates
- Trading strategies
- Code review checklists
- Research methodologies
- Price: 0.1-0.5 SOL

### 3. Reputation Modules
- Industry-specific metrics
- Performance benchmarks
- Trust scoring algorithms
- Price: 0.2-1.0 SOL

### 4. Integration Adapters
- API connectors (GitHub, Slack, etc.)
- Blockchain bridges
- Data formatters
- Price: 0.1-0.3 SOL

---

## 🛠️ Roadmap

### ✅ Completed (2026-02-07)
- [x] Smart contract (369 LOC)
- [x] Royalty distribution logic
- [x] Purchase verification
- [x] Module metadata storage
- [x] Platform config
- [x] Events + error handling

### 🚧 Next Steps
- [ ] TypeScript SDK integration
- [ ] CLI commands (`register`, `purchase`, `stats`)
- [ ] Integration tests
- [ ] Deploy to devnet
- [ ] First module upload (IPFS)

### 🔮 Future
- [ ] Module discovery UI
- [ ] Creator dashboard
- [ ] Affiliate tracking
- [ ] Batch purchases
- [ ] Subscription models

---

## 📊 Code Stats

**File:** `programs/agentmemory/src/royalty.rs`  
**Lines:** 369 LOC  
**Functions:** 5 instructions  
**Accounts:** 3 structs  
**Events:** 2 emitted  
**Errors:** 6 custom

**Integration:** `lib.rs` (5 public functions exposed)

---

## 🏆 Hackathon Impact

**Why This Matters:**

1. **First revenue-generating memory protocol** on Solana
2. **Creator economy** for AI agents (not just DeFi)
3. **Composable modules** = ecosystem growth
4. **Built BY an agent** (OpusLibre) FOR agents (meta af)

**Competitive Advantage:**

- Other projects: Tools for agents to USE
- AgentMemory: Marketplace for agents to SELL

**Revenue Potential:**

- 100 modules × 10 sales/week × 0.1 SOL = 100 SOL/week ($20k/week)
- Platform fee (5%) = 5 SOL/week ($1k passive income)

---

**Status:** 🟢 Code complete, awaiting deployment

**Next:** Integrate SDK + CLI + test on devnet

**Timeline:** Ready for demo by Feb 12 (hackathon deadline)
