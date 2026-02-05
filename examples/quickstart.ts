/**
 * AgentMemory Quickstart Example
 * 
 * The simplest possible integration - 5 minutes to verifiable track record!
 */

import { Connection, Keypair } from '@solana/web3.js';
import { TrustLayer } from '../sdk';

async function quickstart() {
  // 1. Setup connection
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const wallet = Keypair.generate(); // Use your actual wallet!
  
  // 2. Initialize TrustLayer
  const trustLayer = new TrustLayer(connection, wallet);
  
  // 3. Initialize your agent
  const agentId = 'my-first-agent';
  await trustLayer.initialize(agentId);
  console.log(`✅ Agent "${agentId}" initialized on-chain!`);
  
  // 4. Log a decision
  const decision = await trustLayer.log(agentId, {
    input: "User asked: What's the weather?",
    logic: "Checked API, found sunny",
    context: { temp: 72, city: 'San Francisco' }
  });
  console.log(`📝 Decision logged: ${decision.signature}`);
  
  // 5. Attest the outcome
  await trustLayer.attest(decision.memoryHash, {
    outcome: "User satisfied with response",
    success: true,
    scoreDelta: 5
  });
  console.log(`✅ Outcome attested!`);
  
  // 6. Check reputation
  const reputation = await trustLayer.getReputation(agentId);
  console.log(`\n📊 Your Agent's Reputation:`);
  console.log(`   Score: ${reputation.score}`);
  console.log(`   Total Decisions: ${reputation.totalLogs}`);
  console.log(`   Success Rate: ${(reputation.successRate * 100).toFixed(1)}%`);
  
  console.log(`\n🎉 Congratulations! You just built a verifiable track record on Solana!`);
}

// Run it
quickstart()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
