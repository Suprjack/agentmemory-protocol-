# AgentMemory Protocol - SDK API Documentation

**Version:** 1.0.0  
**Language:** TypeScript  
**Solana Network:** Devnet (testnet) / Mainnet-beta  
**Last Updated:** 2026-02-07

---

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Core Concepts](#core-concepts)
4. [API Reference](#api-reference)
5. [Examples](#examples)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

---

## Installation

### NPM Package (coming soon)
```bash
npm install @agentmemory/sdk
```

### From Source (current)
```bash
git clone https://github.com/ThibautCampana/agentmemory-protocol
cd agentmemory-protocol/sdk
npm install
```

### Dependencies
```json
{
  "@coral-xyz/anchor": "^0.30.1",
  "@solana/web3.js": "^1.95.0"
}
```

---

## Quick Start

### Initialize Client

```typescript
import { AgentMemoryClient, ModuleCategory } from '@agentmemory/sdk';
import { Connection, Keypair } from '@solana/web3.js';
import { Wallet } from '@coral-xyz/anchor';

// Connect to Solana
const connection = new Connection('https://api.devnet.solana.com');

// Load your wallet (keep this secure!)
const keypair = Keypair.fromSecretKey(yourSecretKey);
const wallet = new Wallet(keypair);

// Create client
const client = new AgentMemoryClient(connection, wallet);
```

### Register a Memory Module

```typescript
const txSignature = await client.registerModule(
  'my-memory-v1',           // Unique module ID
  'My Memory System',        // Display name
  'Custom memory for XYZ',   // Description
  0.1,                       // Price in SOL
  'QmABC123...',             // IPFS hash
  ModuleCategory.Custom      // Category
);

console.log('Module registered:', txSignature);
```

### Purchase a Module

```typescript
const txSignature = await client.purchaseModule('bitemporal-v1');
console.log('Purchase successful:', txSignature);
```

### Download Purchased Module

```typescript
// Check if you own it
const hasPurchased = await client.hasPurchased(
  wallet.publicKey,
  'bitemporal-v1'
);

if (hasPurchased) {
  const content = await client.downloadModule('bitemporal-v1');
  console.log('Module content:', content);
}
```

---

## Core Concepts

### Module Categories

AgentMemory supports 5 memory types:

| Category | Description | Typical Price | Use Case |
|----------|-------------|---------------|----------|
| **BiTemporal** | Working memory + permanent archive | 0.08-0.15 SOL | Decay-enabled memory systems |
| **Procedural** | How-to knowledge (skills, workflows) | 0.05-0.12 SOL | Task execution, automation |
| **Semantic** | Facts, concepts, relationships | 0.10-0.20 SOL | Knowledge graphs, reasoning |
| **Episodic** | Event sequences, conversations | 0.04-0.10 SOL | Chat history, activity logs |
| **Custom** | User-defined memory types | 0.05-0.50 SOL | Experimental, specialized |

### Pricing Model

**Module Sale:**
- Creator sets price (0.05-0.5 SOL recommended)
- Platform fee: 5% (goes to protocol treasury)
- Creator royalty: 90% (goes to creator wallet)
- Buyer gets: Permanent access to module content

**Example (0.1 SOL module):**
- Buyer pays: 0.1 SOL
- Creator receives: 0.09 SOL (90%)
- Platform receives: 0.005 SOL (5%)
- Royalty vault: 0.005 SOL (5% for future royalties)

### On-Chain vs Off-Chain Data

**On-Chain (Solana):**
- Module metadata (name, description, price, creator)
- Purchase records (who bought what, when)
- Revenue tracking (total sales, earnings)

**Off-Chain (IPFS):**
- Module content (.md files, JSON configs)
- Large datasets, knowledge graphs
- Binary assets (images, embeddings)

---

## API Reference

### Class: `AgentMemoryClient`

Main SDK interface for interacting with the AgentMemory smart contract.

#### Constructor

```typescript
constructor(
  connection: Connection,
  wallet: Wallet,
  programId?: PublicKey
)
```

**Parameters:**
- `connection` - Solana RPC connection
- `wallet` - Wallet with signing authority
- `programId` - (Optional) Custom program address

**Example:**
```typescript
const client = new AgentMemoryClient(
  new Connection('https://api.mainnet-beta.solana.com'),
  myWallet,
  new PublicKey('Mem1...') // Optional: override program ID
);
```

---

### Methods

#### `initialize(platformFeePct, royaltyPct, feeCollector)`

**Admin only.** Initialize the platform configuration. Run once on deployment.

```typescript
async initialize(
  platformFeePct: number,
  royaltyPct: number,
  feeCollector: PublicKey
): Promise<string>
```

**Parameters:**
- `platformFeePct` - Platform fee percentage (default: 5)
- `royaltyPct` - Creator royalty percentage (default: 10)
- `feeCollector` - Wallet to receive platform fees

**Returns:** Transaction signature

**Throws:** If platform already initialized

**Example:**
```typescript
const tx = await client.initialize(
  5,  // 5% platform fee
  10, // 10% royalty to creators
  adminWallet.publicKey
);
```

---

#### `registerModule(moduleId, name, description, priceSOL, ipfsHash, category)`

Register a new memory module in the marketplace.

```typescript
async registerModule(
  moduleId: string,
  name: string,
  description: string,
  priceSOL: number,
  ipfsHash: string,
  category: ModuleCategory
): Promise<string>
```

**Parameters:**
- `moduleId` - Unique identifier (lowercase, alphanumeric + hyphens)
- `name` - Display name (max 64 chars)
- `description` - Short description (max 256 chars)
- `priceSOL` - Price in SOL (0.05-0.50 recommended)
- `ipfsHash` - IPFS content identifier (CID)
- `category` - Module type (enum)

**Returns:** Transaction signature

**Throws:**
- If `moduleId` already exists
- If price is 0 or negative
- If IPFS hash is invalid

**Example:**
```typescript
const tx = await client.registerModule(
  'semantic-graph-v2',
  'Semantic Knowledge Graph',
  'Graph-based memory with 10k+ entity relationships',
  0.15,
  'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
  ModuleCategory.Semantic
);
```

**Best Practices:**
- Use semantic versioning in `moduleId` (e.g., `mymodule-v1`, `mymodule-v2`)
- Test upload to IPFS before registering
- Price competitively (check marketplace for similar modules)

---

#### `purchaseModule(moduleId)`

Purchase a memory module from the marketplace.

```typescript
async purchaseModule(moduleId: string): Promise<string>
```

**Parameters:**
- `moduleId` - Module to purchase

**Returns:** Transaction signature

**Throws:**
- If module doesn't exist
- If already purchased
- If insufficient SOL balance

**Example:**
```typescript
// Check price first
const module = await client.getModule('bitemporal-v1');
console.log(`Price: ${module.price / LAMPORTS_PER_SOL} SOL`);

// Purchase
const tx = await client.purchaseModule('bitemporal-v1');
console.log('Purchased! TX:', tx);
```

**Gas Fees:**
- Transaction fee: ~0.000005 SOL
- Total cost: `modulePrice + 0.000005 SOL`

---

#### `getModule(moduleId)`

Fetch module metadata from on-chain storage.

```typescript
async getModule(moduleId: string): Promise<MemoryModule>
```

**Parameters:**
- `moduleId` - Module identifier

**Returns:** `MemoryModule` object

**Throws:** If module doesn't exist

**Example:**
```typescript
const module = await client.getModule('bitemporal-v1');

console.log(module.name);           // "Bi-Temporal Memory System"
console.log(module.price);          // 100000000 (lamports)
console.log(module.creator);        // PublicKey object
console.log(module.totalPurchases); // 42
console.log(module.ipfsHash);       // "QmABC..."
```

**Return Type:**
```typescript
interface MemoryModule {
  moduleId: string;
  creator: PublicKey;
  name: string;
  description: string;
  price: number;          // in lamports
  ipfsHash: string;
  category: ModuleCategory;
  createdAt: number;      // Unix timestamp
  totalPurchases: number;
  totalRevenue: number;   // in lamports
}
```

---

#### `hasPurchased(user, moduleId)`

Check if a user owns a specific module.

```typescript
async hasPurchased(
  user: PublicKey,
  moduleId: string
): Promise<boolean>
```

**Parameters:**
- `user` - Wallet public key
- `moduleId` - Module identifier

**Returns:** `true` if purchased, `false` otherwise

**Example:**
```typescript
const owns = await client.hasPurchased(
  myWallet.publicKey,
  'bitemporal-v1'
);

if (owns) {
  console.log('You own this module!');
} else {
  console.log('Purchase required');
}
```

---

#### `getPurchase(user, moduleId)`

Get purchase details (timestamp, buyer info).

```typescript
async getPurchase(
  user: PublicKey,
  moduleId: string
): Promise<UserPurchase | null>
```

**Parameters:**
- `user` - Wallet public key
- `moduleId` - Module identifier

**Returns:** `UserPurchase` object or `null` if not purchased

**Example:**
```typescript
const purchase = await client.getPurchase(
  myWallet.publicKey,
  'bitemporal-v1'
);

if (purchase) {
  const date = new Date(purchase.purchasedAt * 1000);
  console.log(`Purchased on: ${date.toLocaleDateString()}`);
}
```

**Return Type:**
```typescript
interface UserPurchase {
  user: PublicKey;
  moduleId: string;
  purchasedAt: number; // Unix timestamp
}
```

---

#### `downloadModule(moduleId)`

Download module content from IPFS (requires prior purchase).

```typescript
async downloadModule(moduleId: string): Promise<string>
```

**Parameters:**
- `moduleId` - Module identifier

**Returns:** Module content as string

**Throws:**
- If module not purchased
- If IPFS fetch fails

**Example:**
```typescript
try {
  const content = await client.downloadModule('bitemporal-v1');
  
  // Save to file
  await fs.writeFile('MEMORY.md', content);
  console.log('Module installed!');
} catch (err) {
  console.error('Download failed:', err.message);
}
```

**IPFS Gateway:**
- Default: `https://ipfs.io/ipfs/`
- Timeout: 30 seconds
- Fallback: Try multiple gateways if primary fails

---

## Examples

### Example 1: Creator Workflow (Register + Earn)

```typescript
import { AgentMemoryClient, ModuleCategory } from '@agentmemory/sdk';
import { Connection, Keypair } from '@solana/web3.js';
import { Wallet } from '@coral-xyz/anchor';
import fs from 'fs';

async function createAndSellModule() {
  // Setup
  const connection = new Connection('https://api.devnet.solana.com');
  const keypair = Keypair.fromSecretKey(/* your key */);
  const wallet = new Wallet(keypair);
  const client = new AgentMemoryClient(connection, wallet);

  // 1. Create module content
  const moduleContent = `
# My Custom Memory System

This module provides XYZ functionality...
  `.trim();

  // 2. Upload to IPFS (use Pinata, Web3.Storage, etc.)
  const ipfsHash = await uploadToIPFS(moduleContent);
  console.log('Uploaded to IPFS:', ipfsHash);

  // 3. Register on marketplace
  const tx = await client.registerModule(
    'my-module-v1',
    'My Custom Memory',
    'Description of what it does',
    0.08, // 0.08 SOL
    ipfsHash,
    ModuleCategory.Custom
  );

  console.log('Module registered! TX:', tx);
  console.log('Module ID: my-module-v1');
  console.log('When someone buys it, you earn 0.072 SOL (90%)');

  // 4. Check sales
  const module = await client.getModule('my-module-v1');
  console.log('Total purchases:', module.totalPurchases);
  console.log('Total revenue:', module.totalRevenue / 1e9, 'SOL');
}
```

---

### Example 2: Buyer Workflow (Browse + Purchase + Install)

```typescript
async function buyAndInstallModule() {
  const connection = new Connection('https://api.devnet.solana.com');
  const wallet = new Wallet(myKeypair);
  const client = new AgentMemoryClient(connection, wallet);

  // 1. Browse available modules
  const moduleId = 'bitemporal-v1';
  const module = await client.getModule(moduleId);

  console.log(`Module: ${module.name}`);
  console.log(`Price: ${module.price / 1e9} SOL`);
  console.log(`Purchases: ${module.totalPurchases}`);
  console.log(`Creator: ${module.creator.toBase58()}`);

  // 2. Check if already owned
  const alreadyOwned = await client.hasPurchased(
    wallet.publicKey,
    moduleId
  );

  if (alreadyOwned) {
    console.log('You already own this module!');
  } else {
    // 3. Purchase
    const tx = await client.purchaseModule(moduleId);
    console.log('Purchase successful! TX:', tx);
  }

  // 4. Download and install
  const content = await client.downloadModule(moduleId);
  await fs.promises.writeFile('./MEMORY.md', content);
  console.log('Module installed to ./MEMORY.md');
}
```

---

### Example 3: Integration with OpenClaw

```typescript
import { AgentMemoryClient } from '@agentmemory/sdk';
import { Connection, Keypair } from '@solana/web3.js';

async function openclawIntegration() {
  // Load wallet from OpenClaw workspace
  const walletPath = process.env.HOME + '/.openclaw/workspace/.solana-wallet.json';
  const secretKey = JSON.parse(await fs.promises.readFile(walletPath));
  const keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));

  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const client = new AgentMemoryClient(connection, new Wallet(keypair));

  // Agent autonomously purchases memory upgrade
  const hasBiTemporal = await client.hasPurchased(
    keypair.publicKey,
    'bitemporal-v1'
  );

  if (!hasBiTemporal) {
    console.log('Purchasing bi-temporal memory upgrade...');
    await client.purchaseModule('bitemporal-v1');
    
    // Download and integrate
    const memorySystem = await client.downloadModule('bitemporal-v1');
    await fs.promises.writeFile('./MEMORY.md', memorySystem);
    
    console.log('Memory system upgraded! 🧠');
  }
}
```

---

## Error Handling

### Common Errors

#### `ModuleNotFound`
```typescript
try {
  await client.getModule('nonexistent-id');
} catch (err) {
  if (err.message.includes('Account does not exist')) {
    console.error('Module not found!');
  }
}
```

#### `InsufficientFunds`
```typescript
try {
  await client.purchaseModule('expensive-module');
} catch (err) {
  if (err.message.includes('insufficient lamports')) {
    console.error('Not enough SOL to purchase');
  }
}
```

#### `AlreadyPurchased`
```typescript
try {
  await client.purchaseModule('bitemporal-v1');
} catch (err) {
  if (err.message.includes('already initialized')) {
    console.error('You already own this module');
  }
}
```

#### `IPFSDownloadFailed`
```typescript
try {
  await client.downloadModule('bitemporal-v1');
} catch (err) {
  if (err.message.includes('Failed to download from IPFS')) {
    console.error('IPFS gateway timeout, try again');
  }
}
```

### Retry Logic

```typescript
async function purchaseWithRetry(moduleId: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.purchaseModule(moduleId);
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      console.log(`Retry ${i + 1}/${maxRetries}...`);
      await new Promise(r => setTimeout(r, 2000)); // Wait 2s
    }
  }
}
```

---

## Best Practices

### Security

**Never commit private keys:**
```typescript
// ❌ WRONG
const keypair = Keypair.fromSecretKey([1, 2, 3, ...]); // Hardcoded

// ✅ RIGHT
const secretKey = JSON.parse(process.env.SOLANA_PRIVATE_KEY);
const keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
```

**Use environment variables:**
```bash
export SOLANA_PRIVATE_KEY='[1,2,3,...]'
export SOLANA_RPC_URL='https://api.mainnet-beta.solana.com'
```

### Performance

**Batch read operations:**
```typescript
// Check ownership for multiple modules in parallel
const results = await Promise.all([
  client.hasPurchased(wallet.publicKey, 'module-1'),
  client.hasPurchased(wallet.publicKey, 'module-2'),
  client.hasPurchased(wallet.publicKey, 'module-3'),
]);
```

**Cache module metadata:**
```typescript
const moduleCache = new Map<string, MemoryModule>();

async function getCachedModule(moduleId: string) {
  if (!moduleCache.has(moduleId)) {
    moduleCache.set(moduleId, await client.getModule(moduleId));
  }
  return moduleCache.get(moduleId);
}
```

### IPFS Optimization

**Use dedicated gateways:**
```typescript
// Faster, more reliable than public gateways
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
];

async function downloadWithFallback(ipfsHash: string) {
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const response = await fetch(gateway + ipfsHash);
      if (response.ok) return await response.text();
    } catch {}
  }
  throw new Error('All IPFS gateways failed');
}
```

### Testing

**Use devnet for development:**
```typescript
const DEV_CONNECTION = new Connection('https://api.devnet.solana.com');
const PROD_CONNECTION = new Connection('https://api.mainnet-beta.solana.com');

const client = new AgentMemoryClient(
  process.env.NODE_ENV === 'production' ? PROD_CONNECTION : DEV_CONNECTION,
  wallet
);
```

**Airdrop devnet SOL:**
```bash
solana airdrop 2 <YOUR_PUBKEY> --url devnet
```

---

## Rate Limits & Quotas

### Solana RPC

**Public endpoints:**
- Requests: 10-40 per second
- Use private RPC for production (QuickNode, Alchemy, Helius)

**Private RPC:**
- Requests: 100-1000 per second
- Lower latency, higher reliability

### IPFS Gateways

**Public gateways:**
- Bandwidth: 1 GB/day
- Rate limit: 100 requests/minute

**Dedicated gateways (Pinata, Web3.Storage):**
- Bandwidth: 100 GB/month
- Rate limit: 1000 requests/minute

---

## Troubleshooting

### Transaction Failed

**Check wallet balance:**
```typescript
const balance = await connection.getBalance(wallet.publicKey);
console.log('Balance:', balance / 1e9, 'SOL');
```

**Check transaction logs:**
```typescript
const tx = await client.purchaseModule('module-id');
const txDetails = await connection.getTransaction(tx, {
  commitment: 'confirmed'
});
console.log(txDetails.meta.logMessages);
```

### Module Not Loading

**Verify IPFS hash:**
```bash
curl https://ipfs.io/ipfs/<HASH>
```

**Check purchase status:**
```typescript
const purchase = await client.getPurchase(wallet.publicKey, 'module-id');
console.log('Purchase record:', purchase);
```

---

## Support

- **GitHub Issues:** https://github.com/ThibautCampana/agentmemory-protocol/issues
- **Discord:** Coming soon
- **Email:** Coming soon

---

**Generated by OpusLibre on 2026-02-07**  
**Hackathon Submission:** Colosseum Solana Agent Arena  
**License:** MIT
