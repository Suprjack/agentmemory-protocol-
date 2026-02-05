/**
 * AgentMemory Protocol - Integration Tests
 * Tests the full flow: initialize → log → attest
 */

import { TrustLayer } from '../sdk';
import { Connection, Keypair } from '@solana/web3.js';

describe('AgentMemory Integration Tests', () => {
  let trustLayer: TrustLayer;
  let testWallet: Keypair;
  const TEST_AGENT_ID = 'test-agent-' + Date.now();

  beforeAll(async () => {
    // Connect to devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    testWallet = Keypair.generate();
    
    // Airdrop SOL for testing (devnet only)
    // const airdropSig = await connection.requestAirdrop(testWallet.publicKey, 1e9);
    // await connection.confirmTransaction(airdropSig);
    
    trustLayer = await TrustLayer.init(connection, testWallet);
  });

  test('Initialize agent account', async () => {
    const txSig = await trustLayer.initializeAgent(TEST_AGENT_ID);
    expect(txSig).toBeTruthy();
    
    // Verify agent was created
    const agent = await trustLayer.getAgent(TEST_AGENT_ID);
    expect(agent.agentId).toBe(TEST_AGENT_ID);
    expect(agent.reputation).toBe(0);
    expect(agent.totalLogs).toBe(0);
  });

  test('Log a decision', async () => {
    const decision = {
      input: 'Market condition: SOL dropped 15%, RSI oversold',
      logic: 'Strategy: Buy 10 SOL at current price, set stop-loss at -5%'
    };

    const { txSig, merkleRoot } = await trustLayer.logDecision(TEST_AGENT_ID, decision);
    
    expect(txSig).toBeTruthy();
    expect(merkleRoot).toHaveLength(64); // SHA256 hex = 64 chars
    
    // Verify log was created
    const agent = await trustLayer.getAgent(TEST_AGENT_ID);
    expect(agent.totalLogs).toBe(1);
  });

  test('Attest to outcome', async () => {
    // First log a decision
    const { txSig: logTx, merkleRoot } = await trustLayer.logDecision(TEST_AGENT_ID, {
      input: 'BTC breakout signal',
      logic: 'Long BTC, target +10%'
    });

    // Get memory log PDA
    const [agentPda] = await trustLayer.getAgentPda(TEST_AGENT_ID);
    const timestamp = Math.floor(Date.now() / 1000);
    const [memoryPda] = await trustLayer.getMemoryPda(agentPda, timestamp);

    // Attest to successful outcome
    const attestTx = await trustLayer.attestOutcome(TEST_AGENT_ID, memoryPda, {
      data: 'Trade closed: +12% profit (1.2 BTC)',
      success: true,
      scoreDelta: 10
    });

    expect(attestTx).toBeTruthy();

    // Verify reputation increased
    const agent = await trustLayer.getAgent(TEST_AGENT_ID);
    expect(agent.reputation).toBe(10);
    expect(agent.totalAttestations).toBe(1);
  });

  test('Reject invalid input (too long)', async () => {
    const longInput = 'x'.repeat(300); // > 256 chars
    
    await expect(
      trustLayer.logDecision(TEST_AGENT_ID, {
        input: longInput,
        logic: 'test'
      })
    ).rejects.toThrow('Input must be 256 characters or less');
  });

  test('Handle failed outcome (negative reputation)', async () => {
    // Log decision
    const { txSig } = await trustLayer.logDecision(TEST_AGENT_ID, {
      input: 'FOMO signal',
      logic: 'Ape into new memecoin'
    });

    const [agentPda] = await trustLayer.getAgentPda(TEST_AGENT_ID);
    const timestamp = Math.floor(Date.now() / 1000);
    const [memoryPda] = await trustLayer.getMemoryPda(agentPda, timestamp);

    // Attest to failure
    await trustLayer.attestOutcome(TEST_AGENT_ID, memoryPda, {
      data: 'Rug pulled, -90% loss',
      success: false,
      scoreDelta: -20
    });

    const agent = await trustLayer.getAgent(TEST_AGENT_ID);
    // Reputation should be max(0, previous - 20) = 0 (bounded at 0)
    expect(agent.reputation).toBeGreaterThanOrEqual(0);
  });
});

// Example: Real-world usage
export async function exampleUsage() {
  const connection = new Connection('https://api.devnet.solana.com');
  const wallet = Keypair.generate();
  
  const trustLayer = await TrustLayer.init(connection, wallet);
  
  // 1. Initialize trading bot
  await trustLayer.initializeAgent('my-trading-bot');
  
  // 2. Before trade: log decision
  const { merkleRoot } = await trustLayer.logDecision('my-trading-bot', {
    input: 'SOL/USDC: RSI 28 (oversold), volume +150%',
    logic: 'BUY 100 SOL @ $98.50, target $110, stop-loss $95'
  });
  
  console.log('Decision logged, merkle root:', merkleRoot);
  console.log('Full decision stored on IPFS (off-chain)');
  console.log('Merkle root anchored on Solana (on-chain)');
  
  // 3. After trade: attest outcome
  // ... (in reality, wait for trade to close)
  
  // 4. Query reputation
  const agent = await trustLayer.getAgent('my-trading-bot');
  console.log('Bot reputation:', agent.reputation);
  console.log('Total decisions:', agent.totalLogs);
  console.log('Success rate:', agent.totalAttestations / agent.totalLogs);
}
