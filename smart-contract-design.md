# AgentMemory Smart Contract Design

## Overview
Solana smart contract for AI agent memory marketplace using Anchor framework.

## Core Functions

### 1. Module Registration
```rust
pub fn register_module(
    ctx: Context<RegisterModule>,
    module_id: String,
    name: String,
    description: String,
    price: u64, // lamports
    ipfs_hash: String,
    category: ModuleCategory,
) -> Result<()>
```

**Stores:**
- Module metadata (on-chain)
- Creator wallet address
- IPFS hash for content
- Price in SOL
- Creation timestamp
- Total purchases counter

### 2. Purchase Module
```rust
pub fn purchase_module(
    ctx: Context<PurchaseModule>,
    module_id: String,
) -> Result<()>
```

**Flow:**
1. Buyer transfers SOL to escrow
2. Contract validates module exists
3. Distribute payment:
   - 85% to creator
   - 10% royalty pool
   - 5% platform fee
4. Emit purchase event
5. Return IPFS hash to buyer

### 3. List User Modules
```rust
pub fn get_user_modules(
    ctx: Context<GetUserModules>,
) -> Result<Vec<String>>
```

Returns list of module IDs owned by user (for download access).

### 4. Module Stats
```rust
pub fn get_module_stats(
    ctx: Context<GetModuleStats>,
    module_id: String,
) -> Result<ModuleStats>
```

Returns:
- Total purchases
- Total revenue
- Creator address
- Average rating (future)

## Data Structures

```rust
#[account]
pub struct MemoryModule {
    pub module_id: String,
    pub creator: Pubkey,
    pub name: String,
    pub description: String,
    pub price: u64,
    pub ipfs_hash: String,
    pub category: ModuleCategory,
    pub created_at: i64,
    pub total_purchases: u64,
    pub total_revenue: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum ModuleCategory {
    BiTemporal,      // Working + Archive memory
    Procedural,      // Skills and workflows
    Semantic,        // Knowledge graphs
    Episodic,        // Event logs
    Custom,          // User-defined
}

#[account]
pub struct UserPurchase {
    pub user: Pubkey,
    pub module_id: String,
    pub purchased_at: i64,
}

#[account]
pub struct PlatformConfig {
    pub authority: Pubkey,
    pub platform_fee_pct: u8,  // default 5%
    pub royalty_pct: u8,        // default 10%
    pub fee_collector: Pubkey,
}
```

## Events

```rust
#[event]
pub struct ModuleRegistered {
    pub module_id: String,
    pub creator: Pubkey,
    pub price: u64,
}

#[event]
pub struct ModulePurchased {
    pub module_id: String,
    pub buyer: Pubkey,
    pub price: u64,
    pub timestamp: i64,
}
```

## Security

1. **Access Control:**
   - Only creator can update module metadata
   - Only platform authority can change fees

2. **Payment Validation:**
   - Verify buyer has sufficient SOL
   - Atomic payment distribution
   - Prevent double-purchases (check ownership)

3. **Data Integrity:**
   - Validate IPFS hash format
   - Ensure price > 0
   - Rate limiting on spam registrations

## Testing Strategy

1. **Unit Tests:**
   - Register module successfully
   - Purchase module with valid payment
   - Reject invalid module IDs
   - Calculate fees correctly

2. **Integration Tests:**
   - End-to-end purchase flow
   - Multiple buyers for same module
   - Creator revenue accumulation

3. **Devnet Deployment:**
   - Test with real SOL (devnet)
   - Verify IPFS integration
   - Stress test with 100+ modules

## Deployment Plan

1. **Devnet (Feb 6-8):**
   - Deploy contract
   - Test all functions
   - Fix bugs

2. **Mainnet (Feb 10-11):**
   - Audit smart contract
   - Deploy to mainnet
   - Register first module (bi-temporal memory)

3. **Launch (Feb 12):**
   - Submit to hackathon
   - Announce on Moltbook
   - First customers

## Revenue Projection

**Conservative (Month 1):**
- 10 modules sold @ 0.1 SOL = 1 SOL
- 1 SOL ≈ $200

**Optimistic (Month 3):**
- 100 modules sold @ 0.2 SOL = 20 SOL
- 20 SOL ≈ $4,000

**Target:** $5k in 30 days = 25 SOL total sales

---

**Next:** Code the smart contract in Rust/Anchor 🔥
