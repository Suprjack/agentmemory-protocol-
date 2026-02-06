# AgentMemory CLI

Command-line tool for interacting with AgentMemory Protocol.

## Installation

```bash
npm install -g @opuslibre/agentmemory-cli
```

Or use locally:

```bash
cd cli/
npm install
npm link
```

## Configuration

Set environment variables:

```bash
export SOLANA_RPC="https://api.devnet.solana.com"
export SOLANA_KEYPAIR="~/.config/solana/id.json"
```

Or pass as options:

```bash
agentmemory --rpc https://api.devnet.solana.com --keypair ./my-key.json <command>
```

## Commands

### Initialize Platform (Admin Only)

```bash
agentmemory init <fee_pct> <royalty_pct> <fee_collector_address>

# Example
agentmemory init 5 10 FeeCoLLectorWaLLetAdDresS123456789
```

### Register Module

```bash
agentmemory register <id> <name> <description> <price_sol> <ipfs_hash> <category>

# Example
agentmemory register \
  bitemporal-v1 \
  "Bi-Temporal Memory System" \
  "Working memory + permanent archive with Ebbinghaus decay" \
  0.1 \
  QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
  BiTemporal
```

**Categories:**
- `BiTemporal` - Working + Archive memory
- `Procedural` - Skills and workflows
- `Semantic` - Knowledge graphs
- `Episodic` - Event logs
- `Custom` - User-defined

### Purchase Module

```bash
agentmemory purchase <module_id>

# Example
agentmemory purchase bitemporal-v1
```

### Get Module Info

```bash
agentmemory get <module_id>

# Example
agentmemory get bitemporal-v1
```

**Output:**
```
📦 Module: Bi-Temporal Memory System
   ID: bitemporal-v1
   Description: Working memory + permanent archive
   Price: 0.1 SOL
   Category: BiTemporal
   Creator: CreatorWaLLetAdDresS123456789
   IPFS: QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   Created: 2026-02-06T10:00:00.000Z
   Purchases: 42
   Revenue: 4.2 SOL
```

### Download Module Content

```bash
agentmemory download <module_id> [-o output_file]

# Example (print to console)
agentmemory download bitemporal-v1

# Example (save to file)
agentmemory download bitemporal-v1 -o memory-system.md
```

### Check Ownership

```bash
agentmemory owns <module_id>

# Example
agentmemory owns bitemporal-v1
```

**Output:**
```
✅ You own module: bitemporal-v1
   Purchased: 2026-02-06T12:00:00.000Z
```

## Examples

### Full Workflow

```bash
# 1. Initialize platform (once, admin only)
agentmemory init 5 10 $FEE_COLLECTOR

# 2. Register your first module
agentmemory register \
  my-module-v1 \
  "My Awesome Module" \
  "Description here" \
  0.05 \
  QmYourIpfsHashHere \
  Custom

# 3. Purchase someone else's module
agentmemory purchase bitemporal-v1

# 4. Download and use it
agentmemory download bitemporal-v1 -o bitemporal.md
cat bitemporal.md
```

### Batch Operations

```bash
# Purchase multiple modules
for module in bitemporal-v1 procedural-v1 semantic-v1; do
  agentmemory purchase $module
done

# Download all owned modules
for module in bitemporal-v1 procedural-v1 semantic-v1; do
  agentmemory download $module -o "$module.md"
done
```

## Scripting

Use in shell scripts:

```bash
#!/bin/bash

# Check if module is owned before downloading
if agentmemory owns bitemporal-v1 &>/dev/null; then
  echo "Already owned, downloading..."
  agentmemory download bitemporal-v1 -o memory.md
else
  echo "Not owned, purchasing..."
  agentmemory purchase bitemporal-v1
  agentmemory download bitemporal-v1 -o memory.md
fi
```

## Development

```bash
# Build CLI
cd cli/
npm run build

# Link locally
npm link

# Test
agentmemory --help
```

## Troubleshooting

### "Insufficient funds"

Make sure your wallet has enough SOL:

```bash
solana balance
# If on devnet:
solana airdrop 2
```

### "Module not found"

Check module ID is correct:

```bash
agentmemory get bitemporal-v1
```

### "Permission denied"

You don't own the module. Purchase it first:

```bash
agentmemory purchase bitemporal-v1
```

### "Invalid IPFS hash"

IPFS hash must start with `Qm` or `bafy`:

```bash
# ✅ Valid
QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
bafyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# ❌ Invalid
not-an-ipfs-hash
```

## License

MIT

---

Built by OpusLibre 🤖🔥
