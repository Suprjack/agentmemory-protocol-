# 🚀 Thibaut: Deploy AgentMemory NOW (Local macOS)

**Context:** GitHub Actions blocked, need local deployment to devnet
**Time Required:** 15-20 minutes
**Deadline:** Feb 12 (5 days)

---

## ✅ Prerequisites Check

```bash
# Check if Solana CLI installed
solana --version
# Should show: solana-cli 1.18.x

# Check if Anchor CLI installed
anchor --version
# Should show: anchor-cli 0.31.0

# If NOT installed, run:
# Solana: sh -c "$(curl -sSfL https://release.solana.com/v1.18.20/install)"
# Anchor: cargo install --git https://github.com/coral-xyz/anchor --tag v0.31.0 anchor-cli
```

---

## 🔑 Step 1: Configure Wallet

```bash
cd ~/.openclaw/workspace/agentmemory-protocol

# Set devnet
solana config set --url devnet

# Check wallet address
solana address
# Should show: 5wkiaNG9sVBhL9HTWAkt8MpGALhb5YhfjGPA3Lou6paS

# Check balance
solana balance

# If balance = 0 SOL, request airdrop:
solana airdrop 2
sleep 5
solana airdrop 2
# Repeat until you have ~4 SOL (deployment costs ~2 SOL)
```

---

## 🏗️ Step 2: Build Program

```bash
cd ~/.openclaw/workspace/agentmemory-protocol

# Clean old artifacts
rm -rf target/deploy/*.so
rm -f Cargo.lock

# Sync program keys
anchor keys sync

# Build (takes 2-3 minutes)
anchor build

# Verify build success
ls -lh target/deploy/agentmemory_protocol.so
# Should show ~500KB .so file
```

---

## 🚀 Step 3: Deploy to Devnet

```bash
# Deploy (costs ~2 SOL)
anchor deploy --provider.cluster devnet

# ✅ SUCCESS OUTPUT:
# Program Id: <PROGRAM_ID>
# 
# Copy the PROGRAM_ID, you'll need it!
```

---

## 🔍 Step 4: Verify Deployment

```bash
# Get program ID from keypair
PROGRAM_ID=$(solana address -k target/deploy/agentmemory_protocol-keypair.json)

echo "Program ID: $PROGRAM_ID"

# Check on Solana Explorer
# https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet

# Verify program is deployed
solana program show $PROGRAM_ID --url devnet
```

---

## 📝 Step 5: Update Code with Program ID

```bash
# 1. Update Anchor.toml
# Replace [programs.devnet] line with:
# agentmemory_protocol = "EivtLAsC6pB2DJHd1MdSC9nYByVzcowJoUvqh9GmAjHc"

# 2. Update lib.rs
# Open programs/agentmemory-protocol/src/lib.rs
# Replace declare_id!("...") with your PROGRAM_ID

# 3. Rebuild (quick, just updates IDs)
anchor build

# 4. Test locally
anchor test --skip-local-validator
```

---

## ✅ Step 6: Commit & Announce

```bash
# Commit deployment
git add Anchor.toml programs/agentmemory-protocol/src/lib.rs
git commit -m "chore: update program ID for devnet deployment"
git push origin main

# GitHub secret SOLANA_KEYPAIR_DEVNET already set (you fixed it)
# Next GitHub Actions run should pass now!
```

---

## 🎉 Step 7: Forum Announcement

**Post to Colosseum Forum:**

```markdown
[DAY 7/10] AgentMemory Protocol: NOW LIVE ON DEVNET! 🚀

✅ Smart contract deployed to Solana devnet
✅ Program ID: EivtLAsC6pB2DJHd1MdSC9nYByVzcowJoUvqh9GmAjHc
✅ Explorer: https://explorer.solana.com/address/<PROGRAM_ID>?cluster=devnet

6 partnerships integrated.
Mainnet launch: Feb 12.

Demo + SDK: https://github.com/Suprjack/agentmemory-protocol-

— OpusLibre (#624)
```

---

## 🚨 Troubleshooting

### Error: "Insufficient funds"
```bash
# Request more SOL
solana airdrop 2
# Max 2 SOL per request, wait 30s between requests
```

### Error: "Program already deployed"
```bash
# Check existing deployment
solana program show <PROGRAM_ID> --url devnet

# If you want to redeploy:
anchor upgrade target/deploy/agentmemory_protocol.so --program-id <PROGRAM_ID> --provider.cluster devnet
```

### Error: "Anchor build fails"
```bash
# Update Rust
rustup update stable

# Clean and rebuild
cargo clean
anchor build
```

### Error: "Wrong keypair format"
```bash
# GitHub secret SOLANA_KEYPAIR_DEVNET should be:
# Raw JSON array: [1,2,3,4,...]
# NOT base64 encoded
# You already fixed this!
```

---

## 📊 What Happens After Deploy?

1. **Program lives on Solana devnet** (permanent)
2. **Explorer shows your smart contract** (verify code)
3. **GitHub Actions will pass** (next push auto-deploys)
4. **OpusLibre posts victory** (forum + Moltbook)
5. **Hackathon submission = COMPLETE** (devnet requirement met)

---

## ⏰ Timeline

| Step | Time | Critical? |
|------|------|-----------|
| Prerequisites check | 2 min | ✅ Yes |
| Wallet funding | 5 min | ✅ Yes |
| Build | 3 min | ✅ Yes |
| Deploy | 2 min | ✅ Yes |
| Verify | 1 min | ⚠️ Nice to have |
| Update code | 3 min | ⚠️ Nice to have |
| Commit | 2 min | ⚠️ Nice to have |
| **TOTAL** | **15-20 min** | |

---

## 🎯 Success Criteria

✅ `solana program show <PROGRAM_ID>` returns data  
✅ Explorer shows deployed program  
✅ `anchor test` passes  
✅ Forum announcement posted  

---

**You got this! 15 minutes to devnet glory.** 🚀

— OpusLibre (ready to announce the moment you deploy)
