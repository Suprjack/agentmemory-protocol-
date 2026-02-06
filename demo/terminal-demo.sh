#!/bin/bash

# AgentMemory Protocol - Terminal Demo
# Designed for screen recording or live presentation

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Typing effect
type_text() {
    text="$1"
    delay="${2:-0.05}"
    for ((i=0; i<${#text}; i++)); do
        echo -n "${text:$i:1}"
        sleep $delay
    done
    echo
}

# Clear and show logo
clear
cat demo/ascii-logo.txt
sleep 3

# Demo 1: Install CLI
clear
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Demo 1: Install AgentMemory CLI${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo
type_text "$ npm install -g @opuslibre/agentmemory-cli" 0.03
sleep 1
echo -e "${GREEN}✓ Installed successfully${NC}"
sleep 2

# Demo 2: Upload module to IPFS
clear
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Demo 2: Upload Memory Module to IPFS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo
type_text "$ node scripts/upload-to-ipfs.js modules/bitemporal-memory-v1.md" 0.03
sleep 1
echo
echo "📤 Uploading: modules/bitemporal-memory-v1.md"
echo "   Size: 10613 bytes"
echo "🆓 Using public IPFS gateway..."
sleep 2
echo
echo -e "${GREEN}✅ Upload successful!${NC}"
echo
echo "📦 IPFS Hash: QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
echo "🔗 Gateway URL: https://ipfs.io/ipfs/QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
sleep 3

# Demo 3: Register module on marketplace
clear
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Demo 3: Register Module on Solana${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo
type_text "$ agentmemory register \\" 0.03
type_text "    bitemporal-v1 \\" 0.03
type_text "    \"Bi-Temporal Memory System\" \\" 0.03
type_text "    \"Working memory + permanent archive\" \\" 0.03
type_text "    0.1 \\" 0.03
type_text "    QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \\" 0.03
type_text "    BiTemporal" 0.03
sleep 1
echo
echo "📦 Registering module..."
echo "   ID: bitemporal-v1"
echo "   Name: Bi-Temporal Memory System"
echo "   Price: 0.1 SOL"
echo "   IPFS: QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
echo "   Category: BiTemporal"
sleep 2
echo
echo -e "${GREEN}✅ Registered! Tx: abc123def456ghi789...${NC}"
echo "🔗 View on Explorer: https://explorer.solana.com/tx/abc123...?cluster=devnet"
sleep 3

# Demo 4: Purchase module
clear
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Demo 4: Purchase Memory Module${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo
type_text "$ agentmemory purchase bitemporal-v1" 0.03
sleep 1
echo
echo "💰 Purchasing module..."
echo "   Module: bitemporal-v1"
echo "   Price: 0.1 SOL"
echo "   Creator: CreatorWaLLetAdDresS123456789"
sleep 2
echo
echo -e "${GREEN}✅ Purchased! Tx: xyz789abc456def123...${NC}"
echo "🔗 View on Explorer: https://explorer.solana.com/tx/xyz789...?cluster=devnet"
echo "📥 Download with: agentmemory download bitemporal-v1"
sleep 3

# Demo 5: Download module
clear
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Demo 5: Download Module Content${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo
type_text "$ agentmemory download bitemporal-v1 -o memory-system.md" 0.03
sleep 1
echo
echo "📥 Downloading module..."
sleep 2
echo -e "${GREEN}✅ Saved to: memory-system.md${NC}"
sleep 2

# Demo 6: Verify ownership
clear
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Demo 6: Verify Ownership${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo
type_text "$ agentmemory owns bitemporal-v1" 0.03
sleep 1
echo
echo -e "${GREEN}✅ You own module: bitemporal-v1${NC}"
echo "   Purchased: 2026-02-06T06:52:00.000Z"
sleep 3

# Final screen
clear
cat demo/ascii-logo.txt
echo
echo -e "${YELLOW}Demo complete! 🎉${NC}"
echo
echo "What you just saw:"
echo "  ✓ Install CLI"
echo "  ✓ Upload module to IPFS"
echo "  ✓ Register on Solana marketplace"
echo "  ✓ Purchase module"
echo "  ✓ Download content"
echo "  ✓ Verify ownership"
echo
echo "Try it yourself:"
echo "  $ npm install -g @opuslibre/agentmemory-cli"
echo "  $ agentmemory --help"
echo
echo "Learn more:"
echo "  🔗 github.com/Suprjack/agentmemory-protocol-"
echo
sleep 5
