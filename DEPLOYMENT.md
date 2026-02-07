# 🚀 AgentMemory Deployment Guide

Complete guide to deploy AgentMemory Protocol to Solana devnet/mainnet.

## 📋 Prerequisites

### 1. Install Solana CLI
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana --version
```

### 2. Install Rust & Anchor
```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustc --version

# Anchor
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
anchor --version
```

### 3. Install Node.js Dependencies
```bash
npm install
# or
yarn install
```

## 🔧 Configuration

### 1. Generate Keypair
```bash
# For devnet testing
solana-keygen new -o ~/.config/solana/devnet-keypair.json

# For mainnet (SECURE THIS!)
solana-keygen new -o ~/.config/solana/mainnet-keypair.json
```

### 2. Configure Solana CLI
```bash
# Devnet
solana config set --url https://api.devnet.solana.com
solana config set --keypair ~/.config/solana/devnet-keypair.json

# Mainnet (when ready)
solana config set --url https://api.mainnet-beta.solana.com
solana config set --keypair ~/.config/solana/mainnet-keypair.json
```

### 3. Get Devnet SOL
```bash
solana airdrop 2
solana balance
```

## 🏗️ Build & Deploy

### Step 1: Build the Program
```bash
anchor build
```

**Expected output:**
```
   Compiling agentmemory v0.1.0 (/path/to/agentmemory-protocol/programs/agentmemory)
    Finished release [optimized] target(s) in 45.2s
```

### Step 2: Get Program ID
```bash
solana address -k target/deploy/agentmemory-keypair.json
```

**Copy this program ID!** You'll need it.

### Step 3: Update Anchor.toml
Edit `Anchor.toml`:
```toml
[programs.devnet]
agentmemory = "EivtLAsC6pB2DJHd1MdSC9nYByVzcowJoUvqh9GmAjHc"

[programs.mainnet]
agentmemory = "EivtLAsC6pB2DJHd1MdSC9nYByVzcowJoUvqh9GmAjHc"
```

### Step 4: Update lib.rs
Edit `programs/agentmemory/src/lib.rs`:
```rust
declare_id!("EivtLAsC6pB2DJHd1MdSC9nYByVzcowJoUvqh9GmAjHc");
```

### Step 5: Rebuild
```bash
anchor build
```

### Step 6: Deploy to Devnet
```bash
anchor deploy --provider.cluster devnet
```

**Expected output:**
```
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: YOUR_WALLET_ADDRESS
Deploying program "agentmemory"...
Program Id: EivtLAsC6pB2DJHd1MdSC9nYByVzcowJoUvqh9GmAjHc

Deploy success
```

### Step 7: Verify Deployment
```bash
solana program show EivtLAsC6pB2DJHd1MdSC9nYByVzcowJoUvqh9GmAjHc --url devnet
```

## 🧪 Testing

### Run Integration Tests
```bash
anchor test
```

### Test Against Devnet
```bash
anchor test --provider.cluster devnet
```

### Manual Testing
```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { TrustLayer } from './sdk';

const connection = new Connection('https://api.devnet.solana.com');
const programId = new PublicKey('EivtLAsC6pB2DJHd1MdSC9nYByVzcowJoUvqh9GmAjHc');

const trustLayer = await TrustLayer.init(connection, wallet, programId);

// Test initialization
const initTx = await trustLayer.initialize("test-agent");
console.log("Init TX:", initTx);

// Test logging
const logTx = await trustLayer.log("test-agent", {
  input: "Test input",
  logic: "Test logic",
  context: { test: true }
});
console.log("Log TX:", logTx);

// Test attestation
const attestTx = await trustLayer.attest(logTx.memoryHash, {
  outcome: "Success",
  success: true,
  scoreDelta: 10
});
console.log("Attest TX:", attestTx);

// Check reputation
const rep = await trustLayer.getReputation("test-agent");
console.log("Reputation:", rep);
```

## 📊 Monitoring

### Check Program Logs
```bash
solana logs EivtLAsC6pB2DJHd1MdSC9nYByVzcowJoUvqh9GmAjHc --url devnet
```

### Check Account Data
```bash
# Get agent account
solana account AGENT_PDA_ADDRESS --url devnet

# Get memory log
solana account MEMORY_LOG_PDA --url devnet
```

### Transaction Explorer
- Devnet: `https://explorer.solana.com/tx/TRANSACTION_SIGNATURE?cluster=devnet`
- Mainnet: `https://explorer.solana.com/tx/TRANSACTION_SIGNATURE`

## 🌐 Mainnet Deployment

### ⚠️ Pre-Deployment Checklist
- [ ] Security audit completed
- [ ] Integration tests passing (100%)
- [ ] Devnet tested extensively
- [ ] Bug bounty program ready
- [ ] Documentation complete
- [ ] Emergency pause mechanism tested
- [ ] Upgrade authority secured (multisig recommended)

### Mainnet Steps
```bash
# 1. Configure mainnet
solana config set --url https://api.mainnet-beta.solana.com
solana config set --keypair ~/.config/solana/mainnet-keypair.json

# 2. Fund wallet (you'll need ~5-10 SOL for deployment)
# Transfer from exchange or another wallet

# 3. Deploy
anchor deploy --provider.cluster mainnet

# 4. Verify
solana program show EivtLAsC6pB2DJHd1MdSC9nYByVzcowJoUvqh9GmAjHc --url mainnet
```

### Post-Deployment
1. **Announce** on forum/Twitter/Moltbook
2. **Monitor** program logs for first 24h
3. **Document** program ID in all docs
4. **Update** SDK to point to mainnet
5. **Set up** monitoring/alerts

## 🔐 Security Best Practices

### Program Authority
```bash
# Use multisig for upgrade authority
solana program set-upgrade-authority EivtLAsC6pB2DJHd1MdSC9nYByVzcowJoUvqh9GmAjHc \
  --new-upgrade-authority MULTISIG_ADDRESS
```

### Keypair Security
- **NEVER** commit keypairs to git
- Use hardware wallets for mainnet
- Encrypt keypairs at rest
- Use different keys for devnet/mainnet

### Rate Limiting
Consider implementing:
- Max logs per agent per day
- Min time between attestations
- Spam prevention mechanisms

## 💰 Cost Estimation

### Devnet (Free)
- Deployment: Free (airdrop SOL)
- Transactions: Free

### Mainnet
- **Program deployment**: ~2-5 SOL (one-time)
- **Per transaction**:
  - Initialize agent: ~0.001 SOL
  - Log decision: ~0.0005 SOL
  - Attest outcome: ~0.0005 SOL
- **Rent**: Accounts are rent-exempt (included in creation cost)

### Monthly Operating Costs (estimated)
- 1,000 agents, 100 logs/day each:
  - Logs: 100,000 × 0.0005 = 50 SOL/day
  - Attestations: 100,000 × 0.0005 = 50 SOL/day
  - **Total**: ~100 SOL/day (~$20k/day at $200/SOL)

**Optimization**: Batch transactions to reduce costs by 50%+

## 🐛 Troubleshooting

### "Insufficient funds"
```bash
# Devnet
solana airdrop 2

# Mainnet
# Transfer SOL from exchange/wallet
```

### "Program deployment failed"
```bash
# Check balance
solana balance

# Increase compute budget
anchor deploy --provider.cluster devnet -- --compute-unit-limit 200000
```

### "Program already deployed"
```bash
# Upgrade existing program
anchor upgrade target/deploy/agentmemory.so \
  --program-id EivtLAsC6pB2DJHd1MdSC9nYByVzcowJoUvqh9GmAjHc \
  --provider.cluster devnet
```

### "Tests failing"
```bash
# Clean build
anchor clean
anchor build

# Restart local validator
solana-test-validator --reset

# Run tests with verbose output
anchor test -- --nocapture
```

## 📚 Additional Resources

- [Solana Docs](https://docs.solana.com/)
- [Anchor Book](https://book.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Discord Support](https://discord.gg/solana)

## 🆘 Support

Issues? Questions?
- Open a GitHub issue
- DM [@ThibautCampana](https://x.com/ThibautCampana)
- Join [Colosseum Discord](https://discord.gg/colosseum)

---

**Ready to ship?** Let's build the trust layer! 🚀
