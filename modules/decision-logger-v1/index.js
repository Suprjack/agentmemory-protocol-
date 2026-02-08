/**
 * AgentMemory Module: Decision Logger v1
 * 
 * A simple but powerful memory module that logs decisions
 * with context, reasoning, and outcomes.
 * 
 * Price: FREE (reference implementation)
 * Creator: OpusLibre
 * License: MIT
 */

class DecisionLogger {
  constructor() {
    this.decisions = [];
    this.outcomes = new Map();
  }
  
  /**
   * Log a decision with full context
   */
  log(decision) {
    const entry = {
      id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      input: decision.input || {},
      reasoning: decision.reasoning || '',
      action: decision.action || '',
      confidence: decision.confidence || 0.5,
      context: decision.context || {},
      tags: decision.tags || []
    };
    
    this.decisions.push(entry);
    return entry.id;
  }
  
  /**
   * Attest outcome of a decision
   */
  attest(decisionId, outcome) {
    this.outcomes.set(decisionId, {
      success: outcome.success,
      result: outcome.result,
      timestamp: Date.now(),
      metrics: outcome.metrics || {}
    });
  }
  
  /**
   * Query decisions by criteria
   */
  query(criteria = {}) {
    let results = [...this.decisions];
    
    // Filter by tags
    if (criteria.tags) {
      results = results.filter(d => 
        criteria.tags.some(tag => d.tags.includes(tag))
      );
    }
    
    // Filter by time range
    if (criteria.after) {
      results = results.filter(d => d.timestamp >= criteria.after);
    }
    
    if (criteria.before) {
      results = results.filter(d => d.timestamp <= criteria.before);
    }
    
    // Filter by confidence
    if (criteria.minConfidence) {
      results = results.filter(d => d.confidence >= criteria.minConfidence);
    }
    
    // Sort by timestamp (newest first)
    results.sort((a, b) => b.timestamp - a.timestamp);
    
    // Limit results
    if (criteria.limit) {
      results = results.slice(0, criteria.limit);
    }
    
    return results;
  }
  
  /**
   * Get decision with outcome
   */
  getDecisionWithOutcome(decisionId) {
    const decision = this.decisions.find(d => d.id === decisionId);
    if (!decision) return null;
    
    return {
      ...decision,
      outcome: this.outcomes.get(decisionId) || null
    };
  }
  
  /**
   * Calculate success rate
   */
  getSuccessRate(criteria = {}) {
    const decisions = this.query(criteria);
    const withOutcomes = decisions.filter(d => this.outcomes.has(d.id));
    const successful = withOutcomes.filter(d => 
      this.outcomes.get(d.id).success
    );
    
    return {
      total: decisions.length,
      attested: withOutcomes.length,
      successful: successful.length,
      rate: withOutcomes.length > 0 
        ? successful.length / withOutcomes.length 
        : 0
    };
  }
  
  /**
   * Export to JSON
   */
  export() {
    return {
      decisions: this.decisions,
      outcomes: Object.fromEntries(this.outcomes)
    };
  }
  
  /**
   * Import from JSON
   */
  import(data) {
    this.decisions = data.decisions || [];
    this.outcomes = new Map(Object.entries(data.outcomes || {}));
  }
}

module.exports = DecisionLogger;

// Example usage
if (require.main === module) {
  const logger = new DecisionLogger();
  
  // Log trading decision
  const id1 = logger.log({
    input: { price: 50000, signal: 'bullish' },
    reasoning: 'BTC above MA200, RSI oversold',
    action: 'BUY 0.1 BTC',
    confidence: 0.8,
    tags: ['trading', 'btc']
  });
  
  // Attest outcome (later)
  logger.attest(id1, {
    success: true,
    result: { profit: 500, roi: 0.05 },
    metrics: { executionTime: 1200 }
  });
  
  // Query successful trades
  const successRate = logger.getSuccessRate({ tags: ['trading'] });
  console.log('Success rate:', successRate);
  
  // Export for on-chain storage
  const exported = logger.export();
  console.log('Exported:', JSON.stringify(exported, null, 2));
}
