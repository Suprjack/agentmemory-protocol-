/**
 * AgentMemory Integration Example: Trading Bot
 * 
 * This example shows how a trading agent can use AgentMemory
 * to build a verifiable track record of its decisions.
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { TrustLayer } from '../sdk';

// Configuration
const RPC_URL = process.env.SOLANA_RPC || 'https://api.devnet.solana.com';
const AGENT_ID = 'alpha-trader-v1';

interface TradingSignal {
  pair: string;
  action: 'buy' | 'sell' | 'hold';
  size: number;
  price: number;
  reason: string;
}

interface TradeResult {
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  duration: number; // milliseconds
}

class TradingBot {
  private trustLayer: TrustLayer;
  private agentId: string;
  
  constructor(connection: Connection, wallet: Keypair, agentId: string) {
    this.trustLayer = new TrustLayer(connection, wallet);
    this.agentId = agentId;
  }
  
  /**
   * Initialize the agent's track record on-chain
   */
  async initialize(): Promise<void> {
    console.log(`🤖 Initializing agent: ${this.agentId}`);
    await this.trustLayer.initialize(this.agentId);
    console.log('✅ Agent initialized on-chain');
  }
  
  /**
   * Analyze market and generate trading signal
   */
  async analyzeMarket(pair: string): Promise<TradingSignal> {
    // Simplified example - replace with actual analysis
    const price = await this.getCurrentPrice(pair);
    const rsi = await this.calculateRSI(pair);
    const volume = await this.getVolume(pair);
    
    let action: 'buy' | 'sell' | 'hold' = 'hold';
    let reason = '';
    
    if (rsi < 30 && volume > 1000000) {
      action = 'buy';
      reason = `RSI oversold (${rsi}), high volume (${volume})`;
    } else if (rsi > 70) {
      action = 'sell';
      reason = `RSI overbought (${rsi}), take profit`;
    } else {
      reason = `No clear signal, RSI: ${rsi}`;
    }
    
    return {
      pair,
      action,
      size: action === 'hold' ? 0 : 10, // 10 SOL
      price,
      reason
    };
  }
  
  /**
   * Execute trade and log decision to AgentMemory
   */
  async executeTrade(signal: TradingSignal): Promise<string | null> {
    if (signal.action === 'hold') {
      console.log('⏸️  No trade executed');
      return null;
    }
    
    // Log decision BEFORE executing trade
    console.log(`📝 Logging decision: ${signal.action} ${signal.pair}`);
    
    const logResult = await this.trustLayer.log(this.agentId, {
      input: `Market: ${signal.pair}, Price: ${signal.price}`,
      logic: `Action: ${signal.action}, Reason: ${signal.reason}`,
      context: {
        pair: signal.pair,
        action: signal.action,
        size: signal.size,
        price: signal.price,
        timestamp: Date.now()
      }
    });
    
    console.log(`✅ Decision logged on-chain: ${logResult.signature}`);
    
    // Execute actual trade (simplified)
    const tradeResult = await this.executeOnExchange(signal);
    
    return logResult.memoryHash;
  }
  
  /**
   * Close position and attest outcome
   */
  async closePosition(
    memoryHash: string,
    tradeResult: TradeResult
  ): Promise<void> {
    const success = tradeResult.pnl > 0;
    const scoreDelta = Math.floor(tradeResult.pnlPercent * 10); // 10% profit = +100 score
    
    console.log(`📊 Attesting outcome: ${success ? 'Profit' : 'Loss'} ${tradeResult.pnlPercent.toFixed(2)}%`);
    
    await this.trustLayer.attest(memoryHash, {
      outcome: `PnL: ${tradeResult.pnl.toFixed(4)} SOL (${tradeResult.pnlPercent.toFixed(2)}%)`,
      success,
      scoreDelta,
      context: {
        entryPrice: tradeResult.entryPrice,
        exitPrice: tradeResult.exitPrice,
        duration: tradeResult.duration
      }
    });
    
    console.log(`✅ Outcome attested on-chain`);
  }
  
  /**
   * Get agent's reputation
   */
  async getReputation(): Promise<void> {
    const rep = await this.trustLayer.getReputation(this.agentId);
    
    console.log('\n📈 Agent Reputation:');
    console.log(`   Score: ${rep.score}`);
    console.log(`   Total Decisions: ${rep.totalLogs}`);
    console.log(`   Success Rate: ${(rep.successRate * 100).toFixed(2)}%`);
    console.log(`   Trust Level: ${this.getTrustLevel(rep.score)}`);
  }
  
  private getTrustLevel(score: number): string {
    if (score < 50) return '🔴 Low';
    if (score < 70) return '🟡 Medium';
    if (score < 85) return '🟢 High';
    return '💎 Elite';
  }
  
  // Simplified helper methods (replace with real implementations)
  private async getCurrentPrice(pair: string): Promise<number> {
    // Replace with actual price feed (Pyth, Switchboard, etc.)
    return 98.5;
  }
  
  private async calculateRSI(pair: string): Promise<number> {
    // Replace with actual RSI calculation
    return 28;
  }
  
  private async getVolume(pair: string): Promise<number> {
    // Replace with actual volume data
    return 1500000;
  }
  
  private async executeOnExchange(signal: TradingSignal): Promise<TradeResult> {
    // Replace with actual exchange integration (Jupiter, Raydium, etc.)
    return {
      entryPrice: signal.price,
      exitPrice: signal.price * 1.05, // 5% profit (example)
      pnl: signal.size * 0.05,
      pnlPercent: 5.0,
      duration: 3600000 // 1 hour
    };
  }
}

// Main execution
async function main() {
  // Setup connection
  const connection = new Connection(RPC_URL, 'confirmed');
  const wallet = Keypair.generate(); // Use your actual wallet
  
  // Initialize bot
  const bot = new TradingBot(connection, wallet, AGENT_ID);
  await bot.initialize();
  
  // Trading loop example
  const pairs = ['SOL/USDC', 'RAY/USDC'];
  const tradeMemories = new Map<string, string>();
  
  for (const pair of pairs) {
    // Analyze market
    const signal = await bot.analyzeMarket(pair);
    console.log(`\n🔍 Signal for ${pair}:`, signal);
    
    // Execute trade and log
    const memoryHash = await bot.executeTrade(signal);
    if (memoryHash) {
      tradeMemories.set(pair, memoryHash);
      
      // Wait for position to mature (simplified)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Close and attest
      const result: TradeResult = {
        entryPrice: signal.price,
        exitPrice: signal.price * 1.08, // 8% profit
        pnl: signal.size * 0.08,
        pnlPercent: 8.0,
        duration: 5000
      };
      
      await bot.closePosition(memoryHash, result);
    }
  }
  
  // Show final reputation
  await bot.getReputation();
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(() => console.log('\n✅ Trading session complete'))
    .catch(err => console.error('❌ Error:', err));
}

export { TradingBot, TradingSignal, TradeResult };
