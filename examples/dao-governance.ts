/**
 * AgentMemory Integration Example: DAO Governance Agent
 * 
 * Shows how a DAO agent can build transparent voting history
 * and prove decision quality over time.
 */

import { Connection, Keypair } from '@solana/web3.js';
import { TrustLayer } from '../sdk';

const RPC_URL = process.env.SOLANA_RPC || 'https://api.devnet.solana.com';
const AGENT_ID = 'dao-delegate-v1';

interface Proposal {
  id: string;
  title: string;
  description: string;
  options: string[];
  deadline: number;
  category: 'treasury' | 'governance' | 'protocol' | 'other';
}

interface VoteDecision {
  proposalId: string;
  vote: string;
  reasoning: string[];
  confidence: number; // 0-100
  dataPoints: string[];
}

interface VoteOutcome {
  proposalPassed: boolean;
  myVoteAlignedWithResult: boolean;
  communitySupport: number; // percentage
  postVoteAnalysis: string;
}

class DAOGovernanceAgent {
  private trustLayer: TrustLayer;
  private agentId: string;
  
  constructor(connection: Connection, wallet: Keypair, agentId: string) {
    this.trustLayer = new TrustLayer(connection, wallet);
    this.agentId = agentId;
  }
  
  async initialize(): Promise<void> {
    console.log(`🏛️  Initializing DAO agent: ${this.agentId}`);
    await this.trustLayer.initialize(this.agentId);
    console.log('✅ Agent initialized on-chain');
  }
  
  /**
   * Analyze proposal and decide how to vote
   */
  async analyzeProposal(proposal: Proposal): Promise<VoteDecision> {
    console.log(`\n📋 Analyzing proposal: ${proposal.title}`);
    
    // Gather data
    const historicalData = await this.getHistoricalData(proposal.category);
    const communityFeedback = await this.getCommunityFeedback(proposal.id);
    const financialImpact = await this.calculateFinancialImpact(proposal);
    
    // Make decision
    const reasoning: string[] = [];
    let vote = 'ABSTAIN';
    let confidence = 50;
    
    if (proposal.category === 'treasury') {
      if (financialImpact.roi > 0.15) {
        vote = 'FOR';
        confidence = 80;
        reasoning.push(`Strong ROI projection: ${(financialImpact.roi * 100).toFixed(1)}%`);
      } else if (financialImpact.risk > 0.7) {
        vote = 'AGAINST';
        confidence = 75;
        reasoning.push(`High risk score: ${(financialImpact.risk * 100).toFixed(1)}%`);
      }
    }
    
    // Add community sentiment
    if (communityFeedback.support > 0.75) {
      reasoning.push(`Strong community support: ${(communityFeedback.support * 100).toFixed(1)}%`);
      confidence += 10;
    } else if (communityFeedback.support < 0.25) {
      reasoning.push(`Weak community support: ${(communityFeedback.support * 100).toFixed(1)}%`);
      confidence -= 10;
    }
    
    // Historical precedent
    if (historicalData.similarProposals > 0) {
      const successRate = historicalData.successfulSimilar / historicalData.similarProposals;
      reasoning.push(`Similar proposals success rate: ${(successRate * 100).toFixed(1)}%`);
    }
    
    return {
      proposalId: proposal.id,
      vote,
      reasoning,
      confidence: Math.min(100, Math.max(0, confidence)),
      dataPoints: [
        `Financial Impact: ${JSON.stringify(financialImpact)}`,
        `Community Support: ${(communityFeedback.support * 100).toFixed(1)}%`,
        `Historical Data: ${historicalData.similarProposals} similar proposals`
      ]
    };
  }
  
  /**
   * Submit vote and log decision on-chain
   */
  async submitVote(proposal: Proposal, decision: VoteDecision): Promise<string> {
    console.log(`\n🗳️  Voting ${decision.vote} on proposal ${proposal.id}`);
    console.log(`   Confidence: ${decision.confidence}%`);
    console.log(`   Reasoning:`);
    decision.reasoning.forEach(r => console.log(`   - ${r}`));
    
    // Log decision BEFORE voting
    const logResult = await this.trustLayer.log(this.agentId, {
      input: `Proposal: ${proposal.title} (${proposal.category})`,
      logic: `Vote: ${decision.vote}, Confidence: ${decision.confidence}%, Reasoning: ${decision.reasoning.join('; ')}`,
      context: {
        proposalId: proposal.id,
        vote: decision.vote,
        confidence: decision.confidence,
        reasoning: decision.reasoning,
        dataPoints: decision.dataPoints,
        timestamp: Date.now()
      }
    });
    
    console.log(`✅ Vote decision logged: ${logResult.signature}`);
    
    // Submit actual vote to DAO (simplified)
    await this.executeVote(proposal.id, decision.vote);
    
    return logResult.memoryHash;
  }
  
  /**
   * After proposal execution, attest the outcome
   */
  async attestOutcome(
    memoryHash: string,
    proposal: Proposal,
    outcome: VoteOutcome
  ): Promise<void> {
    console.log(`\n📊 Proposal ${proposal.id} outcome:`);
    console.log(`   Passed: ${outcome.proposalPassed ? 'YES' : 'NO'}`);
    console.log(`   My vote aligned: ${outcome.myVoteAlignedWithResult ? 'YES' : 'NO'}`);
    console.log(`   Community support: ${outcome.communitySupport.toFixed(1)}%`);
    
    // Calculate score delta based on:
    // 1. Did my vote align with outcome?
    // 2. Was the outcome beneficial?
    let scoreDelta = 0;
    let success = false;
    
    if (outcome.myVoteAlignedWithResult) {
      scoreDelta += 5; // Aligned with majority
      success = true;
    }
    
    // Bonus for predicting beneficial outcomes
    if (outcome.proposalPassed && outcome.postVoteAnalysis.includes('positive')) {
      scoreDelta += 10;
    } else if (!outcome.proposalPassed && outcome.postVoteAnalysis.includes('avoided risk')) {
      scoreDelta += 8;
    }
    
    await this.trustLayer.attest(memoryHash, {
      outcome: outcome.postVoteAnalysis,
      success,
      scoreDelta,
      context: {
        proposalPassed: outcome.proposalPassed,
        aligned: outcome.myVoteAlignedWithResult,
        communitySupport: outcome.communitySupport
      }
    });
    
    console.log(`✅ Outcome attested (+${scoreDelta} reputation)`);
  }
  
  /**
   * Generate governance report
   */
  async generateReport(): Promise<void> {
    const rep = await this.trustLayer.getReputation(this.agentId);
    
    console.log('\n📈 DAO Agent Performance Report:');
    console.log('=' .repeat(50));
    console.log(`Total Votes Cast: ${rep.totalLogs}`);
    console.log(`Voting Accuracy: ${(rep.successRate * 100).toFixed(2)}%`);
    console.log(`Reputation Score: ${rep.score}`);
    console.log(`Trust Tier: ${this.getTrustTier(rep.score)}`);
    console.log('=' .repeat(50));
    
    // Calculate delegation worthiness
    const delegationScore = this.calculateDelegationScore(rep);
    console.log(`\n🎯 Delegation Score: ${delegationScore}/100`);
    console.log(`   Recommendation: ${delegationScore > 75 ? '✅ Highly Recommended' : delegationScore > 50 ? '⚠️  Proceed with Caution' : '❌ Not Recommended'}`);
  }
  
  private getTrustTier(score: number): string {
    if (score < 40) return '🔴 Unproven';
    if (score < 60) return '🟡 Developing';
    if (score < 80) return '🟢 Reliable';
    return '💎 Elite Delegate';
  }
  
  private calculateDelegationScore(rep: any): number {
    let score = 0;
    
    // Base score from reputation
    score += Math.min(50, rep.score);
    
    // Bonus for high accuracy
    if (rep.successRate > 0.7) score += 20;
    else if (rep.successRate > 0.6) score += 10;
    
    // Bonus for experience
    if (rep.totalLogs > 100) score += 20;
    else if (rep.totalLogs > 50) score += 15;
    else if (rep.totalLogs > 20) score += 10;
    
    return Math.min(100, score);
  }
  
  // Simplified helper methods
  private async getHistoricalData(category: string): Promise<any> {
    return {
      similarProposals: 15,
      successfulSimilar: 12
    };
  }
  
  private async getCommunityFeedback(proposalId: string): Promise<any> {
    return {
      support: 0.68,
      totalVoters: 1250
    };
  }
  
  private async calculateFinancialImpact(proposal: Proposal): Promise<any> {
    return {
      roi: 0.18,
      risk: 0.35,
      timeframe: 90 // days
    };
  }
  
  private async executeVote(proposalId: string, vote: string): Promise<void> {
    // Execute actual on-chain vote
    console.log(`   Submitting ${vote} vote to DAO...`);
  }
}

// Example usage
async function main() {
  const connection = new Connection(RPC_URL, 'confirmed');
  const wallet = Keypair.generate();
  
  const agent = new DAOGovernanceAgent(connection, wallet, AGENT_ID);
  await agent.initialize();
  
  // Example proposal
  const proposal: Proposal = {
    id: 'PROP-042',
    title: 'Increase Trading Fee to 0.3%',
    description: 'Proposal to increase swap fees from 0.25% to 0.3% to fund treasury',
    options: ['FOR', 'AGAINST', 'ABSTAIN'],
    deadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
    category: 'treasury'
  };
  
  // Analyze and vote
  const decision = await agent.analyzeProposal(proposal);
  const memoryHash = await agent.submitVote(proposal, decision);
  
  // Simulate waiting for proposal execution
  console.log('\n⏳ Waiting for proposal execution...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Attest outcome
  const outcome: VoteOutcome = {
    proposalPassed: false,
    myVoteAlignedWithResult: decision.vote === 'AGAINST',
    communitySupport: 42.5,
    postVoteAnalysis: 'Proposal rejected. Historical data showed fee increases reduce volume - decision avoided risk.'
  };
  
  await agent.attestOutcome(memoryHash, proposal, outcome);
  
  // Generate report
  await agent.generateReport();
}

if (require.main === module) {
  main()
    .then(() => console.log('\n✅ Governance session complete'))
    .catch(err => console.error('❌ Error:', err));
}

export { DAOGovernanceAgent, Proposal, VoteDecision, VoteOutcome };
