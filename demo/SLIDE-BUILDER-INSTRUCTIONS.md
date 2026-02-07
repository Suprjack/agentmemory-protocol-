# 🎨 Slide Builder Instructions

**Tool:** Google Slides (https://slides.google.com)  
**Template:** Start with "Pitch" or "Modern" template  
**Duration:** 3-5 minutes (25 slides)

---

## SETUP

1. **Go to:** https://slides.google.com
2. **Create:** New Presentation
3. **Choose Template:** "Pitch" (clean, professional)
4. **Theme Colors:** 
   - Primary: Purple (#9945FF - Solana)
   - Secondary: Teal (#14F195 - Solana)
   - Background: Dark (#1a1a2e)
   - Text: White

---

## ASSETS READY

**Logo:** `agentmemory-protocol/assets/logo.png` (3D network cube)  
**Screenshots:**
- `demo/screenshots/01-program-account.jpg` ✅
- `demo/screenshots/02-transaction-history.jpg` ✅

**Script:** `demo/DEMO-PITCH-DECK.md` (25 slides structure)

---

## SLIDE-BY-SLIDE BUILD

### SLIDE 1: Title
**Layout:** Title slide
**Content:**
- Insert logo (center, large)
- Title: "AgentMemory Protocol"
- Subtitle: "Trust Layer for AI Agents on Solana"
- Badge text: "🚀 LIVE ON DEVNET"

**Design:**
- Background: Dark gradient (navy to black)
- Logo: 400x400px
- Title font: 72pt, bold, white
- Badge: Green background, white text

---

### SLIDE 2: The Problem
**Layout:** Two columns
**Content:**

**LEFT COLUMN:**
```
Traditional Agents

❌ "Trust me"
❌ No verification
❌ No reputation
❌ No accountability
```

**RIGHT COLUMN:**
```
AgentMemory Agents

✅ "Verify on-chain"
✅ Every decision logged
✅ Reputation earned
✅ Fully verifiable
```

**Design:**
- Red X for left, Green check for right
- Icons: Use emoji or simple shapes
- Contrast: Dark left, bright right

---

### SLIDE 3: The Solution (3 Pillars)
**Layout:** Three columns

**Column 1:**
```
📝 Decision Logging

Every choice recorded
Input + reasoning + outcome
Timestamp + on-chain proof
```

**Column 2:**
```
⭐ Reputation System

Performance-based scores
Real results, not promises
Portable across platforms
```

**Column 3:**
```
🛒 Memory Marketplace

Buy/sell memory modules
Creators earn royalties
Agent economy enabled
```

**Design:**
- Icons at top (large emoji)
- Equal column width
- Purple → Blue → Teal gradient

---

### SLIDE 4: Live Deployment Proof
**Layout:** Image + text

**Image:** Insert `01-program-account.jpg` (full screen)

**Overlay Text:**
```
✅ DEPLOYED ON DEVNET

Program ID:
EivtLAsC6pB2DJHd1MdSC9nYByVzcowJoUvqh9GmAjHc

11 Live Transactions
```

**Design:**
- Screenshot: 80% of slide
- Text overlay: Bottom, semi-transparent background
- Highlight Program ID (green box)

---

### SLIDE 5: Transaction History
**Layout:** Image + stats

**Image:** Insert `02-transaction-history.jpg` (full screen)

**Overlay Stats Box:**
```
11 Successful Transactions:
✓ Platform init
✓ Agent registration
✓ 3 decision logs
✓ 2 attestations
✓ 3 module registrations
✓ 1 purchase completed

All verifiable on Solana Explorer
```

**Design:**
- Screenshot: Full background
- Stats box: Top-right corner, white background
- Green checkmarks for each item

---

### SLIDE 6: Agent opus-libre-001
**Layout:** Stats card

**Content:**
```
Agent: opus-libre-001

Reputation: 25
Decision Logs: 3
Attestations: 2
Status: Active ✅

Every stat verifiable on-chain.
```

**Design:**
- Large centered card (white/light gray)
- Stats in grid (2x2)
- Numbers: 72pt bold
- Labels: 24pt regular
- Bottom text: Italic, smaller

---

### SLIDE 7: Decision Log Example
**Layout:** Two columns

**LEFT:** Transaction details
```
Transaction:
4Wy8VYvbLo2Xs3k...

Input:
"BTC 5% above MA200"

Decision:
"Buy 0.1 BTC at $45,000"

Rationale:
"Technical breakout + 
macro bullish"
```

**RIGHT:** Outcome
```
Result: SUCCESS ✅

Reputation: +10

New Score: 10

Timestamp:
Feb 7, 2026 13:15 UTC
```

**Design:**
- Left column: Purple box
- Right column: Green box
- Monospace font for transaction ID

---

### SLIDE 8: Reputation Flow
**Layout:** Vertical flowchart

**Content:**
```
1. Agent logs decision
   ↓
2. Executes action
   ↓
3. Attests outcome
   ↓
4. Reputation adjusts
   (+10 success / -5 fail)
   ↓
5. Score becomes NFT
```

**Design:**
- Centered flowchart
- Use shapes: rectangles + arrows
- Color gradient: purple → teal
- Each step: white text on colored box

---

### SLIDE 9: Memory Marketplace
**Layout:** Table/List

**Content:**
```
Registered Modules:

Module             Price      Status
────────────────────────────────────
bitemporal-v1      0.1 SOL    ✅
semantic-cache-v1  0.05 SOL   ✅
rag-memory-v1      0.075 SOL  ✅

Creators earn 90% royalty
Platform takes 5-10% fee
```

**Design:**
- Table with borders
- Green checkmarks
- Price column: Bold, teal color
- Footer text: Smaller, italic

---

### SLIDE 10: First Purchase
**Layout:** Transaction card

**Content:**
```
Transaction:
2zESXhRTLFq1a73r3u2k...

Buyer purchased: bitemporal-v1
Price paid: 0.1 SOL ($20)

💰 Royalty Distribution:
  Creator: 0.09 SOL (90%)
  Platform: 0.01 SOL (10%)

Status: ✅ COMPLETED
```

**Design:**
- Large card (centered)
- Transaction ID: Monospace, small
- Price: Large, bold
- Royalty: Indented, breakdown clear
- Status: Green badge, bottom-right

---

### SLIDE 11: Technical Stack
**Layout:** Diagram

**Content:** (Simple boxes + arrows)
```
┌─────────────────┐
│ Solana Smart    │
│ Contract        │
│ 637 LOC Rust    │
└─────────────────┘
        ↓
┌─────────────────┐
│ IPFS Storage    │
│ Memory Modules  │
└─────────────────┘
        ↓
┌─────────────────┐
│ TypeScript SDK  │
│ npm ready       │
└─────────────────┘
```

**Design:**
- Use shapes (rectangles with rounded corners)
- Arrows between layers
- Purple → Blue → Teal gradient
- Text inside boxes: white, centered

---

### SLIDE 12: Code Quality
**Layout:** Split (code + stats)

**LEFT:** Code snippet
```rust
#[program]
pub mod agentmemory {
    pub fn log_decision(
        ctx: Context<LogDecision>,
        input_data: String,
        logic_data: String,
    ) -> Result<()> {
        // On-chain logging
    }
}
```

**RIGHT:** Stats
```
✅ 637 LOC Rust
✅ 9/9 Tests Passing
✅ TypeScript SDK
✅ npm Ready
✅ MIT License
```

**Design:**
- Left: Dark background, code font
- Right: List with green checkmarks
- Equal column width

---

### SLIDE 13: Partnership Ecosystem
**Layout:** Grid (2x3)

**Content:** 6 boxes
```
┌────────────┐  ┌────────────┐  ┌────────────┐
│ AgentDEX   │  │   SAID     │  │Solder-     │
│ Trading    │  │ Identity   │  │Cortex      │
│            │  │            │  │Compliance  │
└────────────┘  └────────────┘  └────────────┘

┌────────────┐  ┌────────────┐  ┌────────────┐
│    ZK      │  │   Money    │  │ Identity   │
│Compression │  │  Machine   │  │ Profiles   │
│  Privacy   │  │    DeFi    │  │            │
└────────────┘  └────────────┘  └────────────┘
```

**Design:**
- 6 equal boxes
- Partner name: Bold, large
- Use case: Smaller, below
- Purple boxes, white text

---

### SLIDE 14-25: Continue pattern...

(I'll create the full slide deck structure, but this gives you the pattern)

---

## VOICEOVER GENERATION

**Once slides are done:**

1. **Go to:** https://elevenlabs.io
2. **Sign up:** Free tier (10K chars)
3. **Choose Voice:** "Adam" or "Antoni" (professional)
4. **Paste Script:** From DEMO-PITCH-DECK.md (slide by slide)
5. **Generate:** Export as MP3
6. **Download:** Save to `demo/voiceover.mp3`

---

## COMBINE SLIDES + VOICE

**Option A: Google Slides Native**
1. In Google Slides: Present → Record
2. Upload voiceover.mp3
3. Sync with slides (timing)
4. Export as video (File → Download → MP4)

**Option B: Kapwing (Easier)**
1. Go to: https://kapwing.com
2. Upload slides (export as images first)
3. Upload voiceover.mp3
4. Sync timing (drag slides to match voice)
5. Export as MP4 (1080p)

---

## EXPORT CHECKLIST

- [ ] Slides as PDF (backup)
- [ ] Slides as MP4 video (primary demo)
- [ ] Voiceover as MP3 (separate, if needed)
- [ ] Individual slides as PNG (for documents)

---

**Total Time Estimate:** 3-4 hours  
**Output:** Professional 4-5 min pitch video

**READY TO BUILD!** 🚀
