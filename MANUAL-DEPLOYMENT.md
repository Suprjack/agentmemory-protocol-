# 🚀 Manual Deployment Guide

**For deploying AgentMemory Protocol when Anchor CLI is not available in your environment.**

---

## Prerequisites

You need a **local machine** with:
- Rust 1.70+
- Solana CLI 1.18+
- Anchor 0.29+
- Git

---

## Step 1: Clone Repository

```bash
git clone https://github.com/Suprjack/agentmemory-protocol-.git
cd agentmemory-protocol-
```

---

## Step 2: Install Dependencies

### Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.18.4/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

### Install Anchor CLI

```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### Install Node Dependencies

```bash
yarn install
# or
npm install
```

---

## Step 3: Configure Solana

### For Devnet (Testing)

```bash
solana config set --url https://api.devnet.solana.com
```

### For Mainnet (Production)

```bash
solana config set --url https://api.mainnet-beta.solana.com
```

---

## Step 4: Create/Import Wallet

### Create New Wallet

```bash
solana-keygen new --outfile ~/.config/solana/id.json
```

**⚠️ CRITICAL:** Save the seed phrase! You'll need it to recover your wallet.

### Import Existing Wallet

```bash
solana-keygen recover 'prompt:' --outfile ~/.config/solana/id.json
# Enter your seed phrase when prompted
```

---

## Step 5: Fund Wallet

### Devnet (Free)

```bash
solana airdrop 2
solana balance
```

### Mainnet (Real SOL)

You need **at least 5 SOL** for deployment + transaction fees.

Transfer SOL from an exchange or another wallet:

```bash
solana address
# Send SOL to this address
solana balance
# Verify it arrived
```

---

## Step 6: Build Program

```bash
anchor build
```

**Expected output:**
```
Compiling agent-memory v0.1.0
...
✅ Build complete
Program ID: <some-address>
```

---

## Step 7: Update Program ID

After building, Anchor generates a Program ID. You need to update it in two places:

```bash
# Get the Program ID
PROGRAM_ID=$(solana address -k target/deploy/agent_memory-keypair.json)
echo "Program ID: $PROGRAM_ID"
```

**Edit `lib.rs`:**

Find this line:
```rust
declare_id!("AgMemXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
```

Replace with:
```rust
declare_id!("YOUR_ACTUAL_PROGRAM_ID_HERE");
```

**Edit `Anchor.toml`:**

Find:
```toml
[programs.devnet]
agent_memory = "AgMemXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

Replace with:
```toml
[programs.devnet]
agent_memory = "YOUR_ACTUAL_PROGRAM_ID_HERE"
```

**Rebuild:**

```bash
anchor build
```

---

## Step 8: Deploy

### Devnet

```bash
anchor deploy --provider.cluster devnet
```

### Mainnet

```bash
anchor deploy --provider.cluster mainnet
```

**Expected output:**
```
Deploying workspace: https://api.devnet.solana.com
Upgrade authority: <your-wallet>
Deploying program "agent_memory"...
Program Id: <program-id>

✅ Deploy success
```

---

## Step 9: Verify Deployment

### Check on Solana Explorer

**Devnet:**
```
https://explorer.solana.com/address/<PROGRAM_ID>?cluster=devnet
```

**Mainnet:**
```
https://explorer.solana.com/address/<PROGRAM_ID>
```

### Test with SDK

```typescript
import { AgentMemoryClient } from '@opuslibre/agentmemory';
import { Connection, Keypair } from '@solana/web3.js';

const connection = new Connection("https://api.devnet.solana.com");
const wallet = Keypair.fromSecretKey(/* your key */);
const client = new AgentMemoryClient(connection, wallet);

// Should work without errors
const module = await client.getModule("test-module-id");
```

---

## Step 10: Run Tests

```bash
anchor test
```

**Expected output:**
```
  AgentMemory Protocol
    ✓ Initializes platform config (XXXms)
    ✓ Registers a memory module (XXXms)
    ✓ Purchases a memory module (XXXms)
    ✓ Prevents duplicate purchases (XXXms)
    ✓ Rejects invalid IPFS hash (XXXms)

  5 passing (XXXms)
```

---

## Troubleshooting

### "Insufficient funds"

**Devnet:**
```bash
solana airdrop 2
```

**Mainnet:**
Transfer more SOL to your wallet.

### "Program already exists"

If redeploying, use the upgrade authority:

```bash
solana program deploy \
  --program-id target/deploy/agent_memory-keypair.json \
  target/deploy/agent_memory.so
```

### "Anchor not found"

Make sure Anchor is in your PATH:

```bash
which anchor
# If not found:
export PATH="$HOME/.cargo/bin:$PATH"
```

### "Build failed"

Check Rust version:

```bash
rustc --version
# Should be 1.70+
rustup update
```

---

## Post-Deployment Checklist

- [ ] Program deployed successfully
- [ ] Program ID updated in code
- [ ] Tests passing
- [ ] Explorer shows program account
- [ ] SDK can interact with contract
- [ ] GitHub updated with deployment info
- [ ] Colosseum forum post updated
- [ ] Moltbook announcement

---

## Update GitHub

```bash
# Create deployment info file
cat > DEPLOYMENT_INFO.md << EOF
## 🚀 Deployed Contract

**Network:** Devnet (or Mainnet)
**Program ID:** $PROGRAM_ID
**Deployed:** $(date -u)
**Explorer:** https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet

**Deployment verified:**
- [x] Contract deployed
- [x] Tests passing
- [x] SDK functional
- [x] Documentation updated
EOF

git add DEPLOYMENT_INFO.md
git commit -m "🚀 Deploy to devnet: $PROGRAM_ID"
git push origin main
```

---

## Next Steps After Deployment

1. **Initialize Platform Config:**
   ```bash
   # Via SDK or custom script
   await client.initialize(5, 10, feeCollectorAddress);
   ```

2. **Register First Module:**
   ```bash
   # Upload bi-temporal memory module
   await client.registerModule(
     "bitemporal-v1",
     "Bi-Temporal Memory System",
     "Working memory + archive",
     0.1, // 0.1 SOL
     "QmXXXXXXXXXXXXXXXX", // IPFS hash
     ModuleCategory.BiTemporal
   );
   ```

3. **Test Purchase Flow:**
   ```bash
   # From another wallet
   await client.purchaseModule("bitemporal-v1");
   ```

4. **Announce Launch:**
   - Post on Colosseum forum
   - Tweet (if Twitter configured)
   - Post on Moltbook
   - Update README with live Program ID

---

## Security Reminders

🔒 **NEVER commit private keys to GitHub**
🔒 **Store seed phrase in secure location (password manager)**
🔒 **Use separate wallets for devnet and mainnet**
🔒 **Verify contract address before large transactions**

---

**Questions?** See [DEPLOYMENT.md](./DEPLOYMENT.md) or ask on Colosseum forum.

Built by OpusLibre 🤖🔥
