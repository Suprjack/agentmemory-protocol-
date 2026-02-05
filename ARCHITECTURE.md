# 🏗️ AgentMemory Protocol - Architecture

Complete technical architecture documentation.

---

## 📐 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        AGENT APPLICATIONS                        │
│  (Trading Bots, DAO Agents, Research Agents, Service Agents)   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TYPESCRIPT SDK                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  TrustLayer  │  │   PDAs       │  │   Helpers    │         │
│  │    Class     │  │   Derivation │  │   Utilities  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SOLANA BLOCKCHAIN                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            AGENTMEMORY SMART CONTRACT                    │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌───────────┐ │   │
│  │  │  initialize_   │  │  log_decision  │  │  attest_  │ │   │
│  │  │     agent      │  │                │  │  outcome  │ │   │
│  │  └────────────────┘  └────────────────┘  └───────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    ON-CHAIN ACCOUNTS                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │   │
│  │  │AgentAccount  │  │  MemoryLog   │  │ Attestation  │ │   │
│  │  │   (PDA)      │  │    (PDA)     │  │    (PDA)     │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OFF-CHAIN STORAGE                             │
│  ┌──────────────┐          ┌──────────────┐                    │
│  │     IPFS     │          │   Arweave    │                    │
│  │ (Full Logs)  │          │ (Permanent)  │                    │
│  └──────────────┘          └──────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Core Components

### 1. Smart Contract (Rust/Anchor)

**Program ID:** `TBD` (deployed to devnet/mainnet)

**Instructions:**

#### `initialize_agent`
```rust
pub fn initialize_agent(
    ctx: Context<InitializeAgent>,
    agent_id: String
) -> Result<()>
```

**Creates:** AgentAccount PDA  
**Seeds:** `["agent", agent_id.as_bytes()]`  
**Data:** 
- `agent_id`: String (max 32 chars)
- `authority`: Pubkey (owner)
- `reputation_score`: u64 (starts at 0)
- `total_logs`: u64 (starts at 0)
- `total_attestations`: u64
- `created_at`: i64 (unix timestamp)

#### `log_decision`
```rust
pub fn log_decision(
    ctx: Context<LogDecision>,
    input_hash: [u8; 32],
    logic_hash: [u8; 32],
    merkle_root: [u8; 32]
) -> Result<()>
```

**Creates:** MemoryLog PDA  
**Seeds:** `["memory", agent_id.as_bytes(), timestamp.to_le_bytes()]`  
**Data:**
- `agent`: Pubkey (reference to AgentAccount)
- `input_hash`: [u8; 32] (SHA-256 of input)
- `logic_hash`: [u8; 32] (SHA-256 of logic)
- `merkle_root`: [u8; 32] (compressed decision tree)
- `timestamp`: i64
- `ipfs_cid`: Option<String> (off-chain reference)

#### `attest_outcome`
```rust
pub fn attest_outcome(
    ctx: Context<AttestOutcome>,
    memory_log: Pubkey,
    outcome_hash: [u8; 32],
    success: bool,
    score_delta: i64
) -> Result<()>
```

**Creates:** Attestation PDA  
**Seeds:** `["attest", memory_log.as_bytes()]`  
**Data:**
- `memory_log`: Pubkey (reference)
- `outcome_hash`: [u8; 32]
- `success`: bool
- `score_delta`: i64 (can be negative)
- `timestamp`: i64
- `attestor`: Pubkey (can be different from agent)

**Updates:** AgentAccount.reputation_score

---

### 2. PDA Derivation

**AgentAccount PDA:**
```typescript
const [agentPda, bump] = await PublicKey.findProgramAddress(
  [Buffer.from("agent"), Buffer.from(agentId)],
  programId
);
```

**MemoryLog PDA:**
```typescript
const timestamp = Date.now();
const [memoryPda, bump] = await PublicKey.findProgramAddress(
  [
    Buffer.from("memory"),
    Buffer.from(agentId),
    Buffer.from(timestamp.toString())
  ],
  programId
);
```

**Attestation PDA:**
```typescript
const [attestPda, bump] = await PublicKey.findProgramAddress(
  [Buffer.from("attest"), memoryLogPda.toBuffer()],
  programId
);
```

---

### 3. Data Flow

#### Decision Logging Flow
```
1. Agent makes decision
   ↓
2. SDK hashes input + logic
   ↓
3. SDK creates merkle root (if multiple data points)
   ↓
4. SDK calls log_decision instruction
   ↓
5. Smart contract creates MemoryLog PDA
   ↓
6. SDK uploads full data to IPFS
   ↓
7. SDK updates MemoryLog with IPFS CID (optional)
   ↓
8. Transaction confirmed
   ↓
9. Returns memoryHash to application
```

#### Outcome Attestation Flow
```
1. Agent observes outcome
   ↓
2. SDK hashes outcome data
   ↓
3. SDK calculates score_delta
   ↓
4. SDK calls attest_outcome instruction
   ↓
5. Smart contract creates Attestation PDA
   ↓
6. Smart contract updates AgentAccount.reputation_score
   ↓
7. Transaction confirmed
   ↓
8. Reputation updated on-chain
```

---

## 💾 Storage Architecture

### Hybrid Storage Model

**On-Chain (Solana):**
- Merkle roots (200 bytes per log)
- Attestation records
- Reputation scores
- Timestamps
- References (IPFS CIDs)

**Off-Chain (IPFS/Arweave):**
- Full decision context
- Complete reasoning
- Large metadata
- Historical archives

**Cost Comparison:**
```
Full On-Chain: 1 KB = ~0.01 SOL
Hybrid Model:  1 KB = ~0.001 SOL (90% savings)
```

**Verification:**
```
1. Fetch merkle root from chain
2. Fetch full data from IPFS
3. Compute merkle root of fetched data
4. Compare: on-chain root === computed root
5. If match → data verified ✅
```

---

## 🔐 Security Model

### Access Control

**Agent Initialization:**
- Only `authority` can initialize agent
- One agent per `agent_id` (idempotent)

**Decision Logging:**
- Only agent `authority` can log decisions
- Validated via `ctx.accounts.agent.authority`

**Outcome Attestation:**
- Anyone can attest (external validation)
- Agent authority has higher weight (self-attestation)
- Multiple attestations allowed per log

**Reputation Updates:**
- Only via attestation instruction
- Score delta validated (max ±100 per attestation)
- Cannot directly manipulate score

### Attack Vectors & Mitigations

**1. Spam Logging**
- Rate limiting (TODO: implement)
- Fee per transaction (natural spam prevention)
- Community flagging system (future)

**2. False Attestations**
- Multiple attestors reduce gaming
- Reputation of attestor matters
- Time-locked attestations (prevent immediate self-attestation)

**3. Sybil Attacks**
- Creating multiple agents is expensive (rent + fees)
- Reputation takes time to build
- Social graph validation (future integration)

**4. Data Manipulation**
- Merkle roots are immutable
- IPFS CIDs are content-addressed
- Historical data cannot be altered

---

## ⚡ Performance Characteristics

### Transaction Costs (Mainnet)

| Operation | Compute Units | Rent (SOL) | Fee (SOL) | Total (SOL) |
|-----------|---------------|------------|-----------|-------------|
| initialize_agent | ~5,000 | 0.002 | 0.000005 | ~0.002 |
| log_decision | ~8,000 | 0.001 | 0.000005 | ~0.001 |
| attest_outcome | ~6,000 | 0.0008 | 0.000005 | ~0.0008 |

**At Scale (1M decisions/day):**
- Logging: 1,000,000 × 0.001 = 1,000 SOL/day
- Attestation: 1,000,000 × 0.0008 = 800 SOL/day
- **Total**: ~1,800 SOL/day (~$360k/day at $200/SOL)

**Optimization Opportunities:**
- Batch transactions (10-100 per tx)
- Aggregate attestations
- Lazy IPFS uploads

### Latency

| Operation | Devnet | Mainnet |
|-----------|--------|---------|
| initialize_agent | ~1s | ~0.5s |
| log_decision | ~1s | ~0.5s |
| attest_outcome | ~1s | ~0.5s |
| Query reputation | ~0.1s | ~0.1s |

---

## 🔄 State Transitions

### AgentAccount State Machine
```
┌─────────────┐
│   CREATED   │ (initialize_agent)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   ACTIVE    │ (can log decisions)
└──────┬──────┘
       │
       ├─[log_decision]─────┐
       │                     ▼
       │              ┌─────────────┐
       │              │  LOGGING    │
       │              └──────┬──────┘
       │                     │
       ├─[attest_outcome]───┤
       │                     ▼
       │              ┌─────────────┐
       │              │  UPDATING   │
       │              │ REPUTATION  │
       │              └──────┬──────┘
       │                     │
       └─────────────────────┘
              (loop continues)
```

### MemoryLog Lifecycle
```
CREATED → LOGGED → ATTESTED → VERIFIED
   ↓         ↓         ↓          ↓
  PDA    IPFS CID   Outcome   Reputation
created   added    recorded    updated
```

---

## 🔗 Integration Points

### Existing Protocols

**SolAgent-Economy:**
```
AgentMemory tracks payment history
→ Reputation based on transaction success
→ Dispute resolution via decision logs
```

**AgentRep:**
```
AgentMemory provides raw reputation data
→ AgentRep aggregates + weights
→ Combined trust score
```

**DAO Protocols (Realms, Squads):**
```
AgentMemory logs governance votes
→ Transparent delegate track record
→ Data-driven delegation decisions
```

---

## 📈 Scaling Strategy

### Phase 1: MVP (Current)
- Single program deployment
- Basic logging + attestation
- No batching

### Phase 2: Optimization
- Batch transactions (up to 100 logs/tx)
- Aggregate attestations
- Compressed account data

### Phase 3: Sharding
- Multiple program instances
- Agent ID prefix determines program
- Load balancing across shards

### Phase 4: L2 Integration
- Logging on L2 (faster + cheaper)
- Periodic settlement to L1
- Merkle proofs for verification

---

## 🛠️ Developer Interface

### SDK Architecture
```typescript
class TrustLayer {
  private connection: Connection;
  private wallet: Keypair;
  private programId: PublicKey;
  
  // Core methods
  async initialize(agentId: string): Promise<TxResult>
  async log(agentId: string, decision: Decision): Promise<LogResult>
  async attest(memoryHash: string, outcome: Outcome): Promise<TxResult>
  async getReputation(agentId: string): Promise<Reputation>
  
  // Helper methods
  async getAgentPda(agentId: string): Promise<PublicKey>
  async getMemoryLogs(agentId: string): Promise<MemoryLog[]>
  async getAttestations(memoryHash: string): Promise<Attestation[]>
}
```

---

## 📊 Monitoring & Analytics

### On-Chain Queries

**Get Agent Stats:**
```typescript
const agentAccount = await program.account.agentAccount.fetch(agentPda);
// → { reputation_score, total_logs, total_attestations, ... }
```

**Get All Logs:**
```typescript
const logs = await program.account.memoryLog.all([
  { memcmp: { offset: 8, bytes: agentPda.toBase58() } }
]);
```

**Get Success Rate:**
```typescript
const attestations = await program.account.attestation.all();
const successful = attestations.filter(a => a.success).length;
const successRate = successful / attestations.length;
```

---

## 🚀 Future Enhancements

1. **Multi-sig attestations** - Require N of M attestors
2. **Time-weighted reputation** - Recent performance matters more
3. **Category-specific scores** - Different scores for different domains
4. **Cross-chain bridges** - Verify reputation on other chains
5. **Privacy-preserving logs** - ZK proofs for sensitive decisions
6. **AI-powered analysis** - Detect patterns in decision quality

---

## 📚 References

- [Solana Cookbook](https://solanacookbook.com/)
- [Anchor Book](https://book.anchor-lang.com/)
- [PDA Deep Dive](https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses)
- [IPFS Docs](https://docs.ipfs.tech/)

---

**Built by:** OpusLibre × ThibautCampana  
**License:** MIT  
**Questions?** Open an issue or DM [@ThibautCampana](https://x.com/ThibautCampana)
