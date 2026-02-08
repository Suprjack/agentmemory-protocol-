/**
 * AgentMemory Module: Reputation Tracker v1
 * 
 * Tracks agent reputation across decisions, attestations, and outcomes.
 * Calculates weighted scores, trust levels, and performance metrics.
 * 
 * Price: 0.05 SOL (~$10)
 * Creator: OpusLibre
 * License: Commercial
 */

class ReputationTracker {
  constructor(config = {}) {
    this.baseReputation = config.baseReputation || 0;
    this.decayRate = config.decayRate || 0.95; // Daily decay
    this.weights = {
      success: config.successWeight || 10,
      failure: config.failureWeight || -5,
      attestation: config.attestationWeight || 2,
      age: config.ageWeight || 0.1
    };
    
    this.history = [];
    this.score = this.baseReputation;
    this.lastUpdate = Date.now();
  }
  
  /**
   * Record a decision outcome
   */
  recordOutcome(outcome) {
    const event = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: outcome.success ? 'success' : 'failure',
      impact: outcome.success ? this.weights.success : this.weights.failure,
      confidence: outcome.confidence || 1.0,
      context: outcome.context || {}
    };
    
    this.history.push(event);
    this.recalculate();
    
    return event.id;
  }
  
  /**
   * Record an attestation
   */
  recordAttestation(attestation) {
    const event = {
      id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: 'attestation',
      impact: this.weights.attestation,
      attestorReputation: attestation.attestorReputation || 50,
      context: attestation.context || {}
    };
    
    // Weight attestation by attestor's reputation
    event.impact *= (event.attestorReputation / 100);
    
    this.history.push(event);
    this.recalculate();
    
    return event.id;
  }
  
  /**
   * Recalculate reputation score with time decay
   */
  recalculate() {
    const now = Date.now();
    const daysSinceLastUpdate = (now - this.lastUpdate) / (24 * 60 * 60 * 1000);
    
    // Apply time decay
    this.score *= Math.pow(this.decayRate, daysSinceLastUpdate);
    
    // Add recent events (last 30 days weighted more)
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const recentEvents = this.history.filter(e => e.timestamp >= thirtyDaysAgo);
    
    recentEvents.forEach(event => {
      const age = (now - event.timestamp) / (24 * 60 * 60 * 1000);
      const ageMultiplier = Math.exp(-this.weights.age * age);
      const confidence = event.confidence || 1.0;
      
      this.score += event.impact * ageMultiplier * confidence;
    });
    
    // Clamp score to reasonable range
    this.score = Math.max(0, Math.min(100, this.score));
    this.lastUpdate = now;
  }
  
  /**
   * Get current reputation score
   */
  getScore() {
    this.recalculate();
    return Math.round(this.score);
  }
  
  /**
   * Get trust level category
   */
  getTrustLevel() {
    const score = this.getScore();
    
    if (score >= 90) return { level: 'exceptional', color: 'gold' };
    if (score >= 75) return { level: 'high', color: 'green' };
    if (score >= 50) return { level: 'medium', color: 'blue' };
    if (score >= 25) return { level: 'low', color: 'orange' };
    return { level: 'untrusted', color: 'red' };
  }
  
  /**
   * Get performance metrics
   */
  getMetrics() {
    const now = Date.now();
    const last30Days = this.history.filter(e => 
      e.timestamp >= now - (30 * 24 * 60 * 60 * 1000)
    );
    
    const successes = last30Days.filter(e => e.type === 'success').length;
    const failures = last30Days.filter(e => e.type === 'failure').length;
    const attestations = last30Days.filter(e => e.type === 'attestation').length;
    
    return {
      score: this.getScore(),
      trustLevel: this.getTrustLevel(),
      last30Days: {
        successes,
        failures,
        attestations,
        successRate: successes + failures > 0 
          ? successes / (successes + failures) 
          : 0,
        totalEvents: last30Days.length
      },
      allTime: {
        totalEvents: this.history.length,
        oldestEvent: this.history[0]?.timestamp || null
      }
    };
  }
  
  /**
   * Export reputation data
   */
  export() {
    return {
      score: this.score,
      lastUpdate: this.lastUpdate,
      history: this.history,
      config: {
        baseReputation: this.baseReputation,
        decayRate: this.decayRate,
        weights: this.weights
      }
    };
  }
  
  /**
   * Import reputation data
   */
  import(data) {
    this.score = data.score || this.baseReputation;
    this.lastUpdate = data.lastUpdate || Date.now();
    this.history = data.history || [];
    
    if (data.config) {
      this.baseReputation = data.config.baseReputation;
      this.decayRate = data.config.decayRate;
      this.weights = data.config.weights;
    }
  }
}

module.exports = ReputationTracker;

// Example usage
if (require.main === module) {
  const tracker = new ReputationTracker({ baseReputation: 50 });
  
  // Record successful decision
  tracker.recordOutcome({ success: true, confidence: 0.9 });
  tracker.recordOutcome({ success: true, confidence: 0.85 });
  
  // Record failure
  tracker.recordOutcome({ success: false, confidence: 0.6 });
  
  // Record attestation from high-rep agent
  tracker.recordAttestation({ attestorReputation: 80 });
  
  // Get metrics
  const metrics = tracker.getMetrics();
  console.log('Reputation:', metrics.score);
  console.log('Trust Level:', metrics.trustLevel.level);
  console.log('Success Rate:', (metrics.last30Days.successRate * 100).toFixed(1) + '%');
}
