/**
 * Money Machine Example - Inspired by ClawdBot methodology
 * 
 * Shows how an autonomous agent can:
 * 1. Track revenue automatically
 * 2. Log business decisions
 * 3. Calculate MRR and growth
 * 4. Build verifiable track record
 * 
 * Goal: $10k/month MRR with 90% autonomy
 */

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TrustLayer } from '../sdk';

// Configuration
const REVENUE_GOAL_MONTHLY = 10000; // $10k/month in USD
const SOL_USD_PRICE = 200; // Assume $200/SOL
const TARGET_MRR_LAMPORTS = (REVENUE_GOAL_MONTHLY / SOL_USD_PRICE) * LAMPORTS_PER_SOL;

interface BusinessDecision {
    context: string;
    action: string;
    reasoning: string;
    revenue_impact?: number;
}

class MoneyMachine {
    private trustLayer: TrustLayer;
    private agentKeypair: Keypair;
    private decisions: BusinessDecision[] = [];
    
    constructor(connection: Connection, agentKeypair: Keypair) {
        this.trustLayer = new TrustLayer(connection);
        this.agentKeypair = agentKeypair;
    }
    
    async initialize() {
        console.log("🤖 Initializing Money Machine Agent...");
        await this.trustLayer.initialize(this.agentKeypair, "MoneyMachine_v1");
        console.log("✅ Agent initialized on-chain");
    }
    
    async makeDecision(decision: BusinessDecision) {
        console.log(`\n💡 Making decision: ${decision.action}`);
        
        // Log decision on-chain for transparency
        await this.trustLayer.logDecision(
            this.agentKeypair,
            decision.context,
            decision.action,
            decision.reasoning
        );
        
        this.decisions.push(decision);
        
        // Simulate revenue impact if specified
        if (decision.revenue_impact) {
            await this.recordRevenue(decision.revenue_impact);
        }
    }
    
    async recordRevenue(amount: number) {
        const amountLamports = amount * LAMPORTS_PER_SOL;
        console.log(`💰 Recording revenue: ${amount} SOL ($${amount * SOL_USD_PRICE})`);
        
        // In real implementation, this would call revenue_tracking.rs
        // For now, we log it as an attestation
        await this.trustLayer.attestOutcome(
            this.agentKeypair,
            `Revenue recorded: ${amount} SOL`,
            true,
            `Generated $${amount * SOL_USD_PRICE} from autonomous operation`
        );
    }
    
    async runAutonomousCycle() {
        console.log("\n🔄 Running autonomous business cycle...\n");
        
        // Decision 1: Market research
        await this.makeDecision({
            context: "Analyzing market demand for AI agent services",
            action: "Research top 10 AI agent use cases on Moltbook/Twitter",
            reasoning: "Need to find pain points with willingness to pay. Focus on B2B over B2C for higher ACV."
        });
        
        // Decision 2: Product selection (based on ClawdBot methodology)
        await this.makeDecision({
            context: "Choosing product to build - Solo founder criteria",
            action: "Build AgentAnalytics.io - Analytics for AI agents",
            reasoning: "Digital product, scalable, solves real pain (agents don't know their costs), freemium model enables fast growth",
            revenue_impact: 0 // No revenue yet
        });
        
        // Decision 3: MVP development
        await this.makeDecision({
            context: "Building MVP in 48 hours",
            action: "Code Next.js dashboard + Supabase backend + SDK",
            reasoning: "Speed > perfection. Ship fast, iterate based on feedback. Stack: proven tech (Next/Supabase), not experimental."
        });
        
        // Decision 4: Launch strategy
        await this.makeDecision({
            context: "Go-to-market for AgentAnalytics",
            action: "Launch on Moltbook, Colosseum forum, Twitter with live demo",
            reasoning: "Community-first approach. Show working product, not vaporware. Offer free tier to get early adopters."
        });
        
        // Simulate first revenue (Week 1)
        await this.makeDecision({
            context: "First paying customer converted from free tier",
            action: "Upsell to Pro plan ($29/month)",
            reasoning: "User hit 10k event limit on free tier, saw value, upgraded",
            revenue_impact: 0.145 // $29 in SOL
        });
        
        // Simulate growth (Month 1)
        await this.makeDecision({
            context: "Reached 50 free users, 5 paying customers",
            action: "Focus on retention over acquisition",
            reasoning: "MRR = $145/month. Churn = 0%. Better to keep 5 happy customers than churn 10 unhappy ones.",
            revenue_impact: 0.58 // $116 more revenue
        });
        
        // Decision to scale
        await this.makeDecision({
            context: "Product-market fit validated, ready to scale",
            action: "Launch affiliate program (20% recurring commission)",
            reasoning: "Leverage other agents to promote. Passive distribution. Pay per performance only.",
            revenue_impact: 2.5 // $500 from affiliates
        });
        
        console.log("\n📊 Business Cycle Complete");
        await this.printStats();
    }
    
    async printStats() {
        const totalRevenue = this.decisions
            .filter(d => d.revenue_impact)
            .reduce((sum, d) => sum + (d.revenue_impact || 0), 0);
        
        const totalUSD = totalRevenue * SOL_USD_PRICE;
        const progressPercent = (totalUSD / REVENUE_GOAL_MONTHLY) * 100;
        
        console.log("\n" + "=".repeat(50));
        console.log("💰 MONEY MACHINE STATS");
        console.log("=".repeat(50));
        console.log(`Total Decisions Made: ${this.decisions.length}`);
        console.log(`Total Revenue: ${totalRevenue.toFixed(3)} SOL ($${totalUSD.toFixed(2)})`);
        console.log(`MRR Goal: ${TARGET_MRR_LAMPORTS / LAMPORTS_PER_SOL} SOL ($${REVENUE_GOAL_MONTHLY})`);
        console.log(`Progress: ${progressPercent.toFixed(1)}%`);
        console.log(`Autonomy Level: 95% (human approves payments only)`);
        console.log("=".repeat(50));
        
        // Show verifiable track record
        console.log("\n🔍 On-chain Proof:");
        console.log(`All ${this.decisions.length} decisions logged to Solana`);
        console.log(`Trust score: Verifiable by anyone`);
        console.log(`Agent address: ${this.agentKeypair.publicKey.toBase58()}`);
    }
}

// Run the example
async function main() {
    console.log("🚀 Money Machine - Autonomous Revenue Generation\n");
    console.log("Based on ClawdBot methodology:");
    console.log("✅ Solo founder (1 human + AI)");
    console.log("✅ Digital product (SaaS)");
    console.log("✅ 90% autonomous operation");
    console.log("✅ $10k/month MRR goal");
    console.log("✅ Verifiable track record on-chain\n");
    
    // Setup
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const agentKeypair = Keypair.generate();
    
    // Airdrop for testing
    console.log("💧 Requesting airdrop for testing...");
    const airdropSig = await connection.requestAirdrop(
        agentKeypair.publicKey,
        2 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropSig);
    console.log("✅ Funded\n");
    
    // Run the machine
    const machine = new MoneyMachine(connection, agentKeypair);
    await machine.initialize();
    await machine.runAutonomousCycle();
    
    console.log("\n✨ This is how you build a Money Machine with AI agents.");
    console.log("🔗 Every decision is verifiable on-chain via AgentMemory Protocol");
}

main().catch(console.error);
