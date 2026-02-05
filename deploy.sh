#!/bin/bash
# AgentMemory Protocol - Deployment Script

set -e

echo "🚀 AgentMemory Protocol Deployment"
echo "=================================="
echo ""

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor not found. Install: https://www.anchor-lang.com/docs/installation"
    exit 1
fi

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Install: https://docs.solana.com/cli/install-solana-cli-tools"
    exit 1
fi

echo "✅ Prerequisites installed"
echo ""

# Select cluster
CLUSTER=${1:-devnet}
echo "📡 Deploying to: $CLUSTER"
echo ""

# Configure Solana CLI
solana config set --url https://api.$CLUSTER.solana.com
echo "✅ Configured Solana CLI for $CLUSTER"
echo ""

# Check wallet balance
BALANCE=$(solana balance | awk '{print $1}')
echo "💰 Wallet balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 2" | bc -l) )); then
    echo "⚠️  Low balance. Need at least 2 SOL for deployment."
    if [ "$CLUSTER" = "devnet" ]; then
        echo "   Requesting airdrop..."
        solana airdrop 2
        echo "✅ Airdrop complete"
    else
        echo "   Please fund your wallet: $(solana address)"
        exit 1
    fi
fi
echo ""

# Build program
echo "🔨 Building Anchor program..."
anchor build
echo "✅ Build complete"
echo ""

# Deploy
echo "🚀 Deploying to $CLUSTER..."
anchor deploy --provider.cluster $CLUSTER
echo "✅ Deployment complete"
echo ""

# Get program ID
PROGRAM_ID=$(solana address -k target/deploy/agentmemory-keypair.json)
echo "📝 Program ID: $PROGRAM_ID"
echo ""

# Update Anchor.toml with deployed ID
echo "📝 Updating Anchor.toml..."
sed -i "s/agentmemory = \".*\"/agentmemory = \"$PROGRAM_ID\"/" Anchor.toml
echo "✅ Updated Anchor.toml"
echo ""

# Verify deployment
echo "🔍 Verifying deployment..."
solana program show $PROGRAM_ID
echo ""

echo "✅ DEPLOYMENT SUCCESSFUL!"
echo ""
echo "Next steps:"
echo "1. Test: anchor test --skip-local-validator"
echo "2. Update README with program ID"
echo "3. Post on Colosseum forum with demo"
echo ""
echo "Program ID: $PROGRAM_ID"
echo "Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=$CLUSTER"
