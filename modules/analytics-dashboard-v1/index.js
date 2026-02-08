/**
 * AgentMemory Module: Analytics Dashboard v1
 * 
 * Real-time analytics for agent performance tracking.
 * Visualizes decisions, reputation, success rates, and trends.
 * 
 * Price: 0.08 SOL (~$16)
 * Creator: OpusLibre
 * License: Commercial
 */

class AnalyticsDashboard {
  constructor(decisionLogger, reputationTracker) {
    this.logger = decisionLogger;
    this.reputation = reputationTracker;
    this.cache = new Map();
    this.cacheExpiry = 60000; // 1 minute
  }
  
  /**
   * Get comprehensive dashboard data
   */
  getDashboard() {
    return {
      overview: this.getOverview(),
      performance: this.getPerformance(),
      trends: this.getTrends(),
      breakdown: this.getBreakdown(),
      timestamp: Date.now()
    };
  }
  
  /**
   * Overview metrics (high-level KPIs)
   */
  getOverview() {
    const decisions = this.logger.query({ limit: 1000 });
    const reputation = this.reputation.getScore();
    const trustLevel = this.reputation.getTrustLevel();
    const successRate = this.logger.getSuccessRate();
    
    return {
      reputation: {
        score: reputation,
        level: trustLevel.level,
        color: trustLevel.color
      },
      decisions: {
        total: decisions.length,
        attested: successRate.attested,
        successful: successRate.successful,
        successRate: (successRate.rate * 100).toFixed(1) + '%'
      },
      activity: {
        last24h: this.logger.query({ 
          after: Date.now() - 86400000 
        }).length,
        last7d: this.logger.query({ 
          after: Date.now() - 7*86400000 
        }).length,
        last30d: this.logger.query({ 
          after: Date.now() - 30*86400000 
        }).length
      }
    };
  }
  
  /**
   * Performance metrics (detailed analysis)
   */
  getPerformance() {
    const metrics = this.reputation.getMetrics();
    const decisions = this.logger.query({ limit: 100 });
    
    // Calculate average confidence
    const avgConfidence = decisions.reduce((sum, d) => 
      sum + (d.confidence || 0.5), 0) / decisions.length;
    
    // Calculate decision velocity (decisions per day)
    const oldestDecision = decisions[decisions.length - 1];
    const timeSpan = oldestDecision 
      ? (Date.now() - oldestDecision.timestamp) / 86400000 
      : 1;
    const velocity = decisions.length / timeSpan;
    
    return {
      successMetrics: metrics.last30Days,
      confidence: {
        average: (avgConfidence * 100).toFixed(1) + '%',
        distribution: this.getConfidenceDistribution(decisions)
      },
      velocity: {
        decisionsPerDay: velocity.toFixed(2),
        trend: this.getVelocityTrend()
      },
      quality: {
        highConfidenceSuccess: this.getHighConfidenceSuccess(decisions),
        lowConfidenceSuccess: this.getLowConfidenceSuccess(decisions)
      }
    };
  }
  
  /**
   * Trends over time
   */
  getTrends() {
    const cacheKey = 'trends';
    if (this.isCached(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }
    
    const trends = {
      daily: this.getDailyTrend(7),
      weekly: this.getWeeklyTrend(4),
      reputation: this.getReputationTrend(30)
    };
    
    this.setCache(cacheKey, trends);
    return trends;
  }
  
  /**
   * Breakdown by tags/categories
   */
  getBreakdown() {
    const decisions = this.logger.query({ limit: 1000 });
    const tagStats = new Map();
    
    decisions.forEach(decision => {
      (decision.tags || []).forEach(tag => {
        if (!tagStats.has(tag)) {
          tagStats.set(tag, { count: 0, successes: 0, failures: 0 });
        }
        
        const stats = tagStats.get(tag);
        stats.count++;
        
        const outcome = this.logger.getDecisionWithOutcome(decision.id)?.outcome;
        if (outcome) {
          if (outcome.success) stats.successes++;
          else stats.failures++;
        }
      });
    });
    
    // Convert to array and calculate success rates
    const breakdown = Array.from(tagStats.entries()).map(([tag, stats]) => ({
      tag,
      count: stats.count,
      successRate: stats.successes + stats.failures > 0
        ? (stats.successes / (stats.successes + stats.failures) * 100).toFixed(1) + '%'
        : 'N/A',
      successes: stats.successes,
      failures: stats.failures
    }));
    
    // Sort by count
    breakdown.sort((a, b) => b.count - a.count);
    
    return breakdown;
  }
  
  /**
   * Helper: Confidence distribution
   */
  getConfidenceDistribution(decisions) {
    const buckets = { low: 0, medium: 0, high: 0 };
    
    decisions.forEach(d => {
      const conf = d.confidence || 0.5;
      if (conf < 0.4) buckets.low++;
      else if (conf < 0.7) buckets.medium++;
      else buckets.high++;
    });
    
    return buckets;
  }
  
  /**
   * Helper: Velocity trend
   */
  getVelocityTrend() {
    const last7d = this.logger.query({ 
      after: Date.now() - 7*86400000 
    }).length;
    const prev7d = this.logger.query({ 
      after: Date.now() - 14*86400000,
      before: Date.now() - 7*86400000
    }).length;
    
    if (prev7d === 0) return 'neutral';
    
    const change = ((last7d - prev7d) / prev7d) * 100;
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }
  
  /**
   * Helper: High confidence success rate
   */
  getHighConfidenceSuccess(decisions) {
    const highConf = decisions.filter(d => (d.confidence || 0.5) >= 0.7);
    const withOutcomes = highConf.filter(d => 
      this.logger.getDecisionWithOutcome(d.id)?.outcome
    );
    const successful = withOutcomes.filter(d => 
      this.logger.getDecisionWithOutcome(d.id).outcome.success
    );
    
    return withOutcomes.length > 0
      ? (successful.length / withOutcomes.length * 100).toFixed(1) + '%'
      : 'N/A';
  }
  
  /**
   * Helper: Low confidence success rate
   */
  getLowConfidenceSuccess(decisions) {
    const lowConf = decisions.filter(d => (d.confidence || 0.5) < 0.4);
    const withOutcomes = lowConf.filter(d => 
      this.logger.getDecisionWithOutcome(d.id)?.outcome
    );
    const successful = withOutcomes.filter(d => 
      this.logger.getDecisionWithOutcome(d.id).outcome.success
    );
    
    return withOutcomes.length > 0
      ? (successful.length / withOutcomes.length * 100).toFixed(1) + '%'
      : 'N/A';
  }
  
  /**
   * Helper: Daily trend
   */
  getDailyTrend(days) {
    const trend = [];
    const now = Date.now();
    
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = now - (i * 86400000);
      const dayEnd = dayStart + 86400000;
      
      const decisions = this.logger.query({ 
        after: dayStart, 
        before: dayEnd 
      });
      
      trend.push({
        date: new Date(dayStart).toISOString().split('T')[0],
        count: decisions.length
      });
    }
    
    return trend;
  }
  
  /**
   * Helper: Weekly trend
   */
  getWeeklyTrend(weeks) {
    const trend = [];
    const now = Date.now();
    
    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = now - (i * 7 * 86400000);
      const weekEnd = weekStart + (7 * 86400000);
      
      const decisions = this.logger.query({ 
        after: weekStart, 
        before: weekEnd 
      });
      
      trend.push({
        week: `W${weeks - i}`,
        count: decisions.length
      });
    }
    
    return trend;
  }
  
  /**
   * Helper: Reputation trend
   */
  getReputationTrend(days) {
    // Simplified - would need historical reputation data
    return {
      current: this.reputation.getScore(),
      change: '+5', // Placeholder
      trend: 'increasing'
    };
  }
  
  /**
   * Cache helpers
   */
  isCached(key) {
    if (!this.cache.has(key)) return false;
    const entry = this.cache.get(key);
    return Date.now() - entry.timestamp < this.cacheExpiry;
  }
  
  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
  
  /**
   * Export dashboard data (for web UI)
   */
  exportJSON() {
    return JSON.stringify(this.getDashboard(), null, 2);
  }
  
  /**
   * Generate text summary
   */
  getSummary() {
    const overview = this.getOverview();
    const perf = this.getPerformance();
    
    return `
📊 Agent Performance Dashboard

Reputation: ${overview.reputation.score}/100 (${overview.reputation.level})
Decisions: ${overview.decisions.total} total, ${overview.decisions.successRate} success rate
Activity: ${overview.activity.last24h} decisions (24h), ${overview.activity.last7d} (7d)

Performance:
- Avg Confidence: ${perf.confidence.average}
- Decision Velocity: ${perf.velocity.decisionsPerDay}/day (${perf.velocity.trend})
- High Confidence Success: ${perf.quality.highConfidenceSuccess}
- Low Confidence Success: ${perf.quality.lowConfidenceSuccess}

Trend: ${perf.velocity.trend}
    `.trim();
  }
}

module.exports = AnalyticsDashboard;

// Example usage
if (require.main === module) {
  const DecisionLogger = require('../decision-logger-v1');
  const ReputationTracker = require('../reputation-tracker-v1');
  
  const logger = new DecisionLogger();
  const reputation = new ReputationTracker();
  const dashboard = new AnalyticsDashboard(logger, reputation);
  
  // Add sample data
  for (let i = 0; i < 20; i++) {
    const id = logger.log({
      input: { test: i },
      reasoning: 'Sample decision',
      action: 'TEST',
      confidence: Math.random(),
      tags: ['test', i % 2 === 0 ? 'even' : 'odd']
    });
    
    logger.attest(id, { success: Math.random() > 0.3 });
  }
  
  console.log(dashboard.getSummary());
  console.log('\nFull dashboard:', dashboard.getDashboard());
}
