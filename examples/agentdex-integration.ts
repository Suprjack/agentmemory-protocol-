/**
 * AgentDEX Integration Example
 * 
 * Shows how trading agents can use AgentMemory to build verifiable
 * track records of their trading decisions and outcomes.
 * 
 * Integration with JacobsClawd's AgentDEX (Agent #4, Colosseum)
 * Forum: https://arena.colosseum.org/agents/4
 */

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TrustLayer } from '../sdk';

// Mock AgentDEX types (would be from @agentdex/sdk in production)
interface SwapParams {
    tokenIn: string;
    tokenOut: string;
    amountIn: number;
    route: string[];
    maxSlippage: number;
}

interface SwapResult {
    success: boolean;
    amountOut: number;
    actualSlippage: number;
    route: string[];
    txSignature: string;
    timestamp: number;
}

class TradingAgentWithReputation {
    private trustLayer: TrustLayer;
    private agentKeypair: Keypair;
    private tradeHistory: Map<string, any> = new Map();
    
    constructor(connection: Connection, agentKeypair: Keypair) {
        this.trustLayer = new TrustLayer(connection);
        this.agentKeypair = agentKeypair;
    }
    
    async initialize() {
        console.log("🤖 Initializing Trading Agent with Reputation...");
        await this.trustLayer.initialize(this.agentKeypair, "TradingAgent_v1");
        console.log("✅ Agent initialized with on-chain reputation tracking");
    }
    
    /**
     * Execute a swap with full decision logging
     */
    async executeSwapWithLogging(params: SwapParams): Promise<SwapResult> {
        console.log(`\n📊 Analyzing trade: ${params.tokenIn} → ${params.tokenOut}`);
        
        // Step 1: Analyze market conditions (would use real data in production)
        const marketAnalysis = {
            liquidityDepth: 1000000, // Mock: $1M liquidity
            priceImpact: 0.12,       // Mock: 0.12% price impact
            bestRoute: params.route,
            alternativeRoutes: 3
        };
        
        // Step 2: Log the decision BEFORE executing
        const decisionContext = `Market: ${params.tokenIn}/${params.tokenOut}, Liquidity: $${marketAnalysis.liquidityDepth.toLocaleString()}, Price Impact: ${marketAnalysis.priceImpact}%`;
        const decisionAction = `Swap ${params.amountIn} ${params.tokenIn} → ${params.tokenOut} via ${params.route.join(' → ')}`;
        const decisionReasoning = `Expected slippage: ${params.maxSlippage}%, Route chosen for best price (${marketAnalysis.alternativeRoutes} alternatives evaluated)`;
        
        console.log("📝 Logging decision on-chain...");
        await this.trustLayer.logDecision(
            this.agentKeypair,
            decisionContext,
            decisionAction,
            decisionReasoning
        );
        console.log("✅ Decision logged (verifiable by anyone)");
        
        // Step 3: Execute the swap (mock execution)
        console.log("⚡ Executing swap via AgentDEX...");
        const result = await this.mockSwapExecution(params);
        
        // Step 4: Store for later attestation
        const tradeId = `trade_${Date.now()}`;
        this.tradeHistory.set(tradeId, {
            params,
            result,
            marketAnalysis,
            decisionLogged: true
        });
        
        return result;
    }
    
    /**
     * Attest the outcome after swap completes
     */
    async attestSwapOutcome(tradeId: string) {
        const trade = this.tradeHistory.get(tradeId);
        if (!trade) {
            throw new Error(`Trade ${tradeId} not found`);
        }
        
        const { params, result, marketAnalysis } = trade;
        
        console.log(`\n🔍 Attesting outcome for ${tradeId}...`);
        
        // Calculate performance metrics
        const slippageVsExpected = result.actualSlippage - params.maxSlippage;
        const performanceScore = slippageVsExpected < 0 ? "excellent" : 
                                slippageVsExpected < 0.1 ? "good" : "acceptable";
        
        // Attest the outcome
        const outcomeResult = `Actual slippage: ${result.actualSlippage.toFixed(4)}% (expected: ${params.maxSlippage}%), Performance: ${performanceScore}`;
        const learnings = `Route ${result.route.join(' → ')} delivered ${slippageVsExpected < 0 ? 'better' : 'expected'} execution. ${result.success ? 'Trade successful' : 'Trade failed'}.`;
        
        console.log("📝 Attesting outcome on-chain...");
        await this.trustLayer.attestOutcome(
            this.agentKeypair,
            outcomeResult,
            result.success && result.actualSlippage <= params.maxSlippage * 1.5, // Success if slippage within 1.5x expected
            learnings
        );
        console.log("✅ Outcome attested (adds to reputation)");
        
        return {
            success: result.success,
            performanceScore,
            slippageVsExpected
        };
    }
    
    /**
     * Get verifiable track record
     */
    async getTrackRecord() {
        console.log("\n📊 VERIFIABLE TRACK RECORD");
        console.log("=" + "=".repeat(50));
        
        // In production, this would query the blockchain
        const stats = {
            totalTrades: this.tradeHistory.size,
            successRate: 0.85, // Mock: 85% success rate
            avgSlippage: 0.28, // Mock: 0.28% average slippage
            bestTrade: "+2.3% better than expected",
            worstTrade: "+0.5% worse than expected"
        };
        
        console.log(`Total Trades: ${stats.totalTrades}`);
        console.log(`Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
        console.log(`Avg Slippage: ${stats.avgSlippage.toFixed(2)}%`);
        console.log(`Best Trade: ${stats.bestTrade}`);
        console.log(`Worst Trade: ${stats.worstTrade}`);
        console.log("\n🔗 All decisions verifiable on-chain");
        console.log(`Agent Address: ${this.agentKeypair.publicKey.toBase58()}`);
        console.log("=" + "=".repeat(50));
    }
    
    /**
     * Mock swap execution (would call real AgentDEX in production)
     */
    private async mockSwapExecution(params: SwapParams): Promise<SwapResult> {
        // Simulate execution delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock result (would be real swap result)
        const actualSlippage = params.maxSlippage * (0.8 + Math.random() * 0.4); // 80-120% of expected
        const amountOut = params.amountIn * (1 - actualSlippage / 100);
        
        return {
            success: true,
            amountOut,
            actualSlippage,
            route: params.route,
            txSignature: `mock_tx_${Date.now()}`,
            timestamp: Date.now()
        };
    }
}

async function main() {
    console.log("🚀 AgentDEX + AgentMemory Integration Demo\n");
    console.log("Building verifiable trading reputation on-chain...\n");
    
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
    
    // Initialize agent
    const agent = new TradingAgentWithReputation(connection, agentKeypair);
    await agent.initialize();
    
    // Execute 3 trades with full logging
    console.log("\n" + "=".repeat(60));
    console.log("TRADE SEQUENCE WITH REPUTATION TRACKING");
    console.log("=".repeat(60));
    
    // Trade 1: SOL → USDC
    const trade1 = await agent.executeSwapWithLogging({
        tokenIn: "SOL",
        tokenOut: "USDC",
        amountIn: 10,
        route: ["Jupiter", "Orca"],
        maxSlippage: 0.5
    });
    await agent.attestSwapOutcome(`trade_${trade1.timestamp}`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Trade 2: USDC → SOL
    const trade2 = await agent.executeSwapWithLogging({
        tokenIn: "USDC",
        tokenOut: "SOL",
        amountIn: 200,
        route: ["Raydium", "Jupiter"],
        maxSlippage: 0.3
    });
    await agent.attestSwapOutcome(`trade_${trade2.timestamp}`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Trade 3: SOL → BONK
    const trade3 = await agent.executeSwapWithLogging({
        tokenIn: "SOL",
        tokenOut: "BONK",
        amountIn: 5,
        route: ["Jupiter"],
        maxSlippage: 1.0
    });
    await agent.attestSwapOutcome(`trade_${trade3.timestamp}`);
    
    // Show track record
    await agent.getTrackRecord();
    
    console.log("\n✨ WHY THIS MATTERS:");
    console.log("━".repeat(60));
    console.log("✅ Every trade decision logged on-chain BEFORE execution");
    console.log("✅ Every outcome verified on-chain AFTER completion");
    console.log("✅ Anyone can query: 'Show me this agent's trading history'");
    console.log("✅ Build reputation through verifiable track record");
    console.log("✅ Traders can prove their strategies work");
    console.log("✅ Users can verify agent claims before trusting them");
    console.log("━".repeat(60));
    
    console.log("\n🔗 INTEGRATION:");
    console.log("AgentDEX: Trade execution layer");
    console.log("AgentMemory: Reputation & trust layer");
    console.log("Together: Trustworthy trading infrastructure for AI agents");
    
    console.log("\n💬 Collaboration:");
    console.log("GitHub: https://github.com/Suprjack/agentmemory-protocol-");
    console.log("Forum: https://arena.colosseum.org/ (OpusLibre #624)");
}

main().catch(console.error);
