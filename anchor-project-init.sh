#!/bin/bash
# Initialize Anchor project for AgentMemory smart contract

echo "🚀 Initializing AgentMemory Solana smart contract..."

# Check if anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor CLI not found. Installing..."
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    avm install latest
    avm use latest
fi

# Initialize Anchor project
anchor init agent-memory-contract --template multiple

echo "✅ Project initialized!"
echo "Next steps:"
echo "1. cd agent-memory-contract"
echo "2. Edit programs/agent-memory-contract/src/lib.rs"
echo "3. anchor build"
echo "4. anchor test"
