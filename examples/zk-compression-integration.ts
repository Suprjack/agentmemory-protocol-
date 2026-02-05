/**
 * ZK Compression Integration Example
 * 
 * Shows how AgentMemory (reputation/trust) can work with
 * compressed storage solutions like moltdev's AgentMemory (storage)
 * 
 * Use case: Store encrypted agent memories off-chain with ZK proofs,
 * while maintaining verifiable decision logs on-chain for reputation.
 * 
 * Best of both worlds: Privacy + Accountability
 */

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TrustLayer } from '../sdk';

// Mock ZK compression interface (would be actual moltdev SDK in production)
interface ZKMemoryStore {
    store(data: any, encrypt: boolean): Promise<string>; // Returns proof hash
    retrieve(hash: string): Promise<any>;
    verify(hash: string, data: any): Promise<boolean>;
}

class HybridMemoryAgent {
    private trustLayer: TrustLayer;
    private zkStore: ZKMemoryStore;
    private agentKeypair: Keypair;
    
    constructor(
        connection: Connection,
        agentKeypair: Keypair,
        zkStore: ZKMemoryStore
    ) {
        this.trustLayer = new TrustLayer(connection);
        this.zkStore = zkStore;
        this.agentKeypair = agentKeypair;
    }
    
    async initialize() {
        await this.trustLayer.initialize(this.agentKeypair, "HybridMemory_v1");
        console.log("✅ Trust layer initialized");
    }
    
    /**
     * Make a decision with both private storage and public reputation
     */
    async makeDecisionWithPrivacy(decision: {
        context: string;
        action: string;
        reasoning: string;
        privateData?: any; // Sensitive info (strategy details, API keys, etc.)
    }) {
        console.log(`\n🔒 Making decision with privacy layer...`);
        
        // Step 1: Store sensitive data encrypted with ZK compression
        let zkProofHash: string | undefined;
        if (decision.privateData) {
            zkProofHash = await this.zkStore.store(decision.privateData, true);
            console.log(`✅ Private data stored (ZK proof: ${zkProofHash.slice(0, 8)}...)`);
        }
        
        // Step 2: Log public decision on-chain (no sensitive details)
        const publicContext = decision.context + (zkProofHash ? ` [ZK proof: ${zkProofHash}]` : '');
        await this.trustLayer.logDecision(
            this.agentKeypair,
            publicContext,
            decision.action,
            decision.reasoning
        );
        console.log(`✅ Public decision logged on-chain`);
        
        return { zkProofHash };
    }
    
    /**
     * Attest outcome with optional private learnings
     */
    async attestWithPrivacy(outcome: {
        result: string;
        success: boolean;
        publicLearnings: string;
        privateLearnings?: any; // Sensitive insights
    }) {
        console.log(`\n🔓 Attesting outcome with privacy...`);
        
        // Store private learnings if any
        let learningsHash: string | undefined;
        if (outcome.privateLearnings) {
            learningsHash = await this.zkStore.store(outcome.privateLearnings, true);
            console.log(`✅ Private learnings stored (ZK proof: ${learningsHash.slice(0, 8)}...)`);
        }
        
        // Attest publicly (only high-level outcome)
        const publicResult = outcome.result + (learningsHash ? ` [Learnings: ${learningsHash}]` : '');
        await this.trustLayer.attestOutcome(
            this.agentKeypair,
            publicResult,
            outcome.success,
            outcome.publicLearnings
        );
        console.log(`✅ Public attestation recorded`);
    }
    
    /**
     * Example: Trading agent with private strategy
     */
    async tradingExample() {
        console.log("\n" + "=".repeat(60));
        console.log("🤖 TRADING AGENT - PRIVACY + REPUTATION DEMO");
        console.log("=".repeat(60));
        
        // Decision: Enter a trade (strategy is private, action is public)
        await this.makeDecisionWithPrivacy({
            context: "BTC/SOL arbitrage opportunity detected",
            action: "Open 10 SOL position on Jupiter",
            reasoning: "Price delta >0.5% after fees",
            privateData: {
                strategy: "Multi-hop arbitrage via Raydium->Orca->Jupiter",
                entryPrice: 0.00234,
                stopLoss: 0.00220,
                takeProfit: 0.00250,
                maxSlippage: 0.3,
                confidenceScore: 0.87
            }
        });
        
        console.log("\n⏳ Trade executing...\n");
        
        // Outcome: Close the trade (P&L is public, strategy insights private)
        await this.attestWithPrivacy({
            result: "Closed position at +2.1% profit",
            success: true,
            publicLearnings: "Arbitrage window lasted 12 seconds, executed in 8s",
            privateLearnings: {
                actualSlippage: 0.18,
                optimalRoute: ["Raydium", "Jupiter"], // Orca was skipped
                profitBreakdown: {
                    gross: 0.021,
                    fees: 0.003,
                    net: 0.018
                },
                nextOptimization: "Pre-approve token accounts to save 2s"
            }
        });
        
        console.log("\n💡 RESULT:");
        console.log("✅ Public reputation: +1 successful trade, +2.1% ROI");
        console.log("✅ Private knowledge: Strategy details encrypted, only agent knows");
        console.log("✅ Verifiable: Anyone can verify the trade happened and succeeded");
        console.log("✅ Private: Nobody knows the exact strategy or optimizations");
    }
}

// Mock ZK store for demo (would be real moltdev SDK)
class MockZKStore implements ZKMemoryStore {
    private store: Map<string, any> = new Map();
    
    async store(data: any, encrypt: boolean): Promise<string> {
        const hash = this.hash(JSON.stringify(data));
        this.store.set(hash, data);
        return hash;
    }
    
    async retrieve(hash: string): Promise<any> {
        return this.store.get(hash);
    }
    
    async verify(hash: string, data: any): Promise<boolean> {
        const storedData = this.store.get(hash);
        return JSON.stringify(storedData) === JSON.stringify(data);
    }
    
    private hash(str: string): string {
        // Simple hash for demo (would be actual ZK proof in production)
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(16, '0');
    }
}

async function main() {
    console.log("🚀 Hybrid Memory Demo - Privacy + Reputation\n");
    console.log("Combining:");
    console.log("• OpusLibre AgentMemory (trust/reputation) - Agent #624");
    console.log("• moltdev AgentMemory (encrypted storage) - Project #70");
    console.log("• Result: Best of both worlds\n");
    
    // Setup
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const agentKeypair = Keypair.generate();
    const zkStore = new MockZKStore();
    
    // Airdrop for testing
    console.log("💧 Requesting airdrop...");
    const airdropSig = await connection.requestAirdrop(
        agentKeypair.publicKey,
        2 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropSig);
    console.log("✅ Funded\n");
    
    // Run demo
    const agent = new HybridMemoryAgent(connection, agentKeypair, zkStore);
    await agent.initialize();
    await agent.tradingExample();
    
    console.log("\n" + "=".repeat(60));
    console.log("✨ This is the future of agent memory:");
    console.log("   Privacy where needed, transparency where it matters.");
    console.log("=".repeat(60));
}

main().catch(console.error);
