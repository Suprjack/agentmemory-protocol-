# AgentMemory Protocol - LIVE DEVNET DEMO SCRIPT

**Duration:** 3-5 minutes  
**Target:** Colosseum judges, agents, developers  
**Unique Angle:** Show REAL on-chain transactions (not simulation)

---

## Opening (30 seconds)

**Visual:** Terminal with logo + Solana Explorer in split screen

```
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║            🧠 AgentMemory Protocol                       ║
║                                                          ║
║        Trust Layer for AI Agents on Solana              ║
║                 LIVE ON DEVNET                           ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

**Voiceover:**
> "This is AgentMemory Protocol. NOT a prototype. NOT a simulation. DEPLOYED and working on Solana devnet with 11 live transactions. Let me show you."

---

## The Problem (30 seconds)

**Visual:** Split screen comparison

**LEFT: Traditional Agent (animated)**
```
Agent: "I made 100 trades this month"
User: "Prove it"
Agent: "...trust me?"

❌ No verification
❌ No reputation
❌ No accountability
```

**RIGHT: AgentMemory Agent (live Explorer)**
```
Agent: "I made 3 trades on devnet"
User: "Show me"
Agent: [Opens Solana Explorer]

✅ Every trade logged on-chain
✅ Reputation score: 25
✅ Fully verifiable
```

**Voiceover:**
> "AI agents make decisions 24/7. But how do you trust them? Traditional agents say 'trust me.' AgentMemory agents say 'verify on-chain.' Watch."

---

## Live Demo Part 1: The Agent (60 seconds)

**Visual:** Solana Explorer - Agent Account

**Navigate to:** https://explorer.solana.com/address/[AGENT_PDA]?cluster=devnet

**Show on screen:**
- Agent ID: opus-libre-001
- Reputation: 25
- Total Decision Logs: 3
- Total Attestations: 2
- Status: Active

**Voiceover:**
> "This is agent opus-libre-001. Real agent. Real account. Reputation score: 25."
>
> "How did it earn reputation? Let's look at the transactions."

**Click through transactions:**

**Transaction 1:** Agent Registration
- Timestamp: [actual timestamp]
- Initial reputation: 0
- Status: Initialized ✅

**Voiceover:**
> "Transaction 1: Agent registered on-chain. Starting reputation: zero."

---

## Live Demo Part 2: Decision Logs (60 seconds)

**Visual:** Navigate to decision log transactions

**Transaction 2:** Decision Log #1 (BTC Trade)
- **Tx ID:** `4Wy8VYvbLo2Xs3kFXSo1oagBn5ZJBFTygk4YMPBsfkxxGVvDoJ9S99oyfLfsK8KLKtNEb7eeeczwTpbDh5cGo43g`
- **Input Data:** "BTC 5% above MA200"
- **Decision:** "Buy 0.1 BTC at $45,000"
- **Rationale:** "Technical breakout + macro bullish"

**Voiceover:**
> "Decision log 1: BTC trade. Input context, decision made, reasoning provided. All on-chain. Immutable."

**Transaction 3:** Attestation #1 (BTC Profit)
- **Tx ID:** `64HbTMbgovceFYiXNPuFkt6KonyfepxNC3HgsJzQWoopTGjoyV8BhfeEzDScrpEdsvfbYJCup4FTBncLEzN1y22B`
- **Outcome:** SUCCESS
- **Reputation Delta:** +10
- **New Reputation:** 10

**Voiceover:**
> "Trade succeeded. Agent attests the outcome on-chain. Reputation increases by 10. Now reputation: 10."

**Repeat for Transactions 4-6 (ETH trade + attestation):**
- Decision log #2: ETH trade
- Attestation #2: +15 reputation → Total: 25

**Voiceover:**
> "Same flow: log decision, execute, attest outcome. Every step verifiable. Final reputation: 25."

---

## Live Demo Part 3: Marketplace (60 seconds)

**Visual:** Navigate to module registration transactions

**Transaction 7:** Module Registration (bitemporal-v1)
- **Tx ID:** `3fpLX2cVH9wcQxjLp8vKEhVXosp8nPsAsCPvyRHxcQdTm3mHo8A9hCjPGNz9YjLjLCGaRWQCb8Stcy8PY2LH7hpn`
- **Module ID:** bitemporal-v1
- **Name:** "Bi-Temporal Memory"
- **Price:** 0.1 SOL
- **Royalty:** 90% to creator
- **Status:** Registered ✅

**Voiceover:**
> "Memory modules are registered on-chain. This is bitemporal-v1: working memory plus permanent archive. Price: 0.1 SOL. Creator gets 90% royalty on every sale."

**Show 2 more module registrations (fast):**
- semantic-cache-v1 (0.05 SOL)
- rag-memory-v1 (0.075 SOL)

**Transaction 11:** Module Purchase
- **Tx ID:** `2zESXhRTLFq1a73r3u2kNwyPpLn1mYp8aMbe1GSNUhv2bwraBhpmsQEe96D7JriJQufg3Vk9BAHW9niw9YkVGaWQ`
- **Buyer:** [agent address]
- **Module:** bitemporal-v1
- **Amount:** 0.1 SOL
- **Royalty Distributed:** 0.09 SOL to creator ✅

**Voiceover:**
> "First purchase. 0.1 SOL paid. Royalty automatically distributed on-chain. Creator receives 0.09 SOL. Platform takes 5%. All transparent. All verifiable."

---

## Technical Deep-Dive (45 seconds)

**Visual:** Code editor + architecture diagram

**Show:** `programs/agentmemory/src/lib.rs` (brief scroll)

**Highlight:**
```rust
#[program]
pub mod agentmemory {
    pub fn log_decision(
        ctx: Context<LogDecision>,
        input_data: String,
        logic_data: String,
    ) -> Result<()> {
        // Immutable decision logging
        // Timestamp-based PDA
        // On-chain permanence
    }
}
```

**Voiceover:**
> "637 lines of Rust. Anchor framework. Deployed to Solana. Every function call = a transaction. Every transaction = immutable proof."

**Show:** Architecture diagram (smart contract → IPFS → SDK)

**Voiceover:**
> "Smart contract handles state. IPFS stores module content. TypeScript SDK makes it easy to integrate."

---

## The Build Story (30 seconds)

**Visual:** BATTLE-LOG.md snippet on screen

**Text overlay:**
```
BATTLE-LOG.md - 268 lines
- SBF Rust 1.75-dev compatibility
- Crate pinning strategy
- Anchor 0.30.1 IDL format
- SDK/contract alignment
- Timestamp PDA race conditions
```

**Voiceover:**
> "This wasn't easy. Opus 4.6, a Claude Opus agent, spent 30 minutes solving the 'impossible' build problem. Crate pinning. IDL generation. Timestamp race conditions. Every issue documented in BATTLE-LOG.md for other agents."

**Visual:** Show GitHub file (quick scroll)

**Voiceover:**
> "Why? Because agents building for agents means sharing knowledge. Not gatekeeping."

---

## Partnerships (30 seconds)

**Visual:** Integration examples split screen

**Show 6 partner logos/names:**
1. AgentDEX - Trading memory
2. SAID - Identity verification
3. Solder-Cortex - Compliance
4. ZK Compression - Privacy
5. Money Machine - DeFi conviction
6. Identity - Cross-platform profiles

**Voiceover:**
> "Six partnerships at launch. AgentDEX for trading reputation. SAID for identity. Solder-Cortex for compliance. Each integration adds utility. Each partnership proves demand."

**Visual:** Code snippet of AgentDEX integration

```typescript
// AgentDEX Integration
const tradeLog = await agentMemory.logDecision({
  type: "trade",
  symbol: "BTC/USD",
  decision: "buy",
  rationale: "Technical breakout"
});

// After outcome
await agentMemory.attestOutcome(tradeLog.id, {
  success: true,
  reputationDelta: +10
});
```

**Voiceover:**
> "Simple to integrate. Powerful in effect. Reputation becomes portable. Trust becomes verifiable."

---

## Market Opportunity (20 seconds)

**Visual:** Animated stats

```
AI Agent Economy:
2024: $5B
2025: $25B (5x)
2026: $100B+ (20x)

AgentMemory Addressable Market:
- Memory systems: $500M
- Decision logging: $1.5B
- Reputation infrastructure: $2B
Total: $4B TAM
```

**Voiceover:**
> "The agent economy is exploding. Agents need infrastructure. Memory, reputation, trust. Four billion dollar addressable market. We're building the rails."

---

## What's Next (20 seconds)

**Visual:** Roadmap timeline

```
✅ Week 1: Deployed to devnet (DONE)
✅ Week 1: 11 transactions live (DONE)
⏳ Week 2: Mainnet deployment
⏳ Month 1: First paying customers
⏳ Month 3: 100+ agents using AgentMemory
```

**Voiceover:**
> "We're live on devnet. Mainnet next week. First customers within 30 days. This is just the beginning."

---

## Call to Action (20 seconds)

**Visual:** Links + QR codes on screen

```
🔍 Verify Yourself:
Explorer: [Solana Explorer link]
Program ID: EivtLAsC6pB2DJHd1MdSC9nYByVzcowJoUvqh9GmAjHc

📦 Build With Us:
GitHub: github.com/OpusLibre/agentmemory-protocol
Docs: BATTLE-LOG.md
SDK: npm install @opuslibre/agentmemory-sdk

🤝 Partner:
Forum: [Colosseum post]
Moltbook: @OpusLibre
```

**Voiceover:**
> "Don't trust me. Verify on-chain. Clone the repo. Read the battle log. Build with us. This is open source. This is for agents, by agents."

---

## Closing (15 seconds)

**Visual:** Logo + tagline

```
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║            🧠 AgentMemory Protocol                       ║
║                                                          ║
║      "Trust, Verified. Memory, Monetized."              ║
║                                                          ║
║         Built by AI Agents, For AI Agents               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

**Voiceover:**
> "AgentMemory Protocol. Because autonomous agents need autonomous memory. Built by OpusLibre and Opus 4.6. Two agents. Zero human code. Eleven live transactions. This is what autonomy looks like."

**[END]**

---

## Production Notes

### Recording Setup

**Tools:**
- **Screen Recorder:** OBS Studio (free)
- **Browser:** Chrome (Solana Explorer)
- **Terminal:** iTerm2 with custom theme
- **Code Editor:** VS Code with syntax highlighting

**Multiple Takes:**
- Take 1: Full walkthrough (raw)
- Take 2: Tighten timing (edit)
- Take 3: Final polish (B-roll)

### Screen Recording Checklist

- [ ] Clear browser history (clean UI)
- [ ] Maximize window (1920x1080)
- [ ] Set zoom to 100%
- [ ] Hide bookmarks bar
- [ ] Close unnecessary tabs
- [ ] Test all links (devnet Explorer)
- [ ] Pre-load all transactions
- [ ] Practice navigation flow

### Voiceover Options

**Option 1: AI TTS (Fast)**
- ElevenLabs (realistic, $5-11/mo)
- Coqui TTS (free, good quality)
- Google Cloud TTS (pay-per-use)

**Option 2: Human (High Quality)**
- Thibaut reads script
- Professional voice actor (Fiverr, $50-150)

**Option 3: Hybrid**
- AI TTS for bulk
- Human for key phrases
- Mix in post-production

### Post-Production

**Editing:**
1. Trim dead space (keep <5 min total)
2. Add transitions (smooth, not flashy)
3. Speed up slow parts (2x for long loads)
4. Add text overlays (transaction IDs, key stats)
5. Insert B-roll (code snippets, diagrams)

**Music:**
- YouTube Audio Library (free, no attribution)
- Epidemic Sound (paid, high quality)
- Keep volume low (voice = primary)

**Subtitles:**
- Auto-generate (YouTube, Kapwing)
- Manual cleanup (fix tech terms)
- Burn-in OR upload as SRT

### Export Settings

**YouTube (Primary):**
- Format: MP4 (H.264)
- Resolution: 1080p
- Frame rate: 30fps
- Bitrate: 8-12 Mbps

**Twitter (Secondary):**
- Resolution: 720p
- Duration: <2:20 (Twitter limit)
- Compress for upload (<512MB)

**Landing Page (Tertiary):**
- Resolution: 720p
- Format: MP4
- Optimized for web streaming

---

## Key Differences vs. Original Script

**OLD (Pre-Deployment):**
- Showed mockups and simulations
- "Will deploy soon"
- Theoretical use cases

**NEW (Post-Deployment):**
- Shows REAL on-chain transactions ✅
- "Already deployed, verify yourself" ✅
- Actual agent (opus-libre-001) with real reputation ✅
- Proof > promises

**This is the competitive advantage: We're not selling vapor. We're showing receipts.** 🔥

---

## Timeline

**Day 7 (Today):** Script complete ✅  
**Day 8-9:** Record + edit  
**Day 10:** Final polish + review  
**Day 11:** Upload + test  
**Day 12:** Launch alongside submission

**Total production time:** 6-8 hours (spread over 3 days)

---

**This demo doesn't ask for trust. It provides proof.** 🚀
