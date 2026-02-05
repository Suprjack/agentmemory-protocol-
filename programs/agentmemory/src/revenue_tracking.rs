use anchor_lang::prelude::*;

/// Revenue tracking module for autonomous agents
/// Inspired by ClawdBot "Money Machine" methodology
#[account]
pub struct RevenueTracker {
    /// Agent public key
    pub agent: Pubkey,
    
    /// Total revenue generated (in lamports)
    pub total_revenue: u64,
    
    /// Monthly recurring revenue (MRR) in lamports
    pub mrr: u64,
    
    /// Number of transactions
    pub transaction_count: u64,
    
    /// Average transaction value
    pub avg_transaction: u64,
    
    /// Timestamp of first transaction
    pub first_transaction_at: i64,
    
    /// Timestamp of last transaction
    pub last_transaction_at: i64,
    
    /// Bump seed for PDA
    pub bump: u8,
}

impl RevenueTracker {
    pub const LEN: usize = 8 + // discriminator
        32 + // agent
        8 +  // total_revenue
        8 +  // mrr
        8 +  // transaction_count
        8 +  // avg_transaction
        8 +  // first_transaction_at
        8 +  // last_transaction_at
        1;   // bump
    
    /// Record a new transaction
    pub fn record_transaction(&mut self, amount: u64, timestamp: i64) {
        self.total_revenue = self.total_revenue.checked_add(amount).unwrap();
        self.transaction_count = self.transaction_count.checked_add(1).unwrap();
        self.avg_transaction = self.total_revenue / self.transaction_count;
        
        if self.first_transaction_at == 0 {
            self.first_transaction_at = timestamp;
        }
        
        self.last_transaction_at = timestamp;
        
        // Update MRR estimate (simple: total revenue / months active)
        let days_active = (timestamp - self.first_transaction_at) / 86400;
        if days_active > 30 {
            let months_active = days_active / 30;
            self.mrr = self.total_revenue / months_active as u64;
        }
    }
    
    /// Calculate revenue growth rate
    pub fn growth_rate(&self) -> f64 {
        if self.first_transaction_at == 0 || self.last_transaction_at == self.first_transaction_at {
            return 0.0;
        }
        
        let days_active = (self.last_transaction_at - self.first_transaction_at) / 86400;
        if days_active < 30 {
            return 0.0;
        }
        
        // Simple growth calculation based on MRR trend
        let daily_rate = self.total_revenue as f64 / days_active as f64;
        (daily_rate / (self.total_revenue as f64 / days_active as f64)) * 100.0
    }
}

#[derive(Accounts)]
pub struct InitializeRevenueTracker<'info> {
    #[account(
        init,
        payer = authority,
        space = RevenueTracker::LEN,
        seeds = [b"revenue", agent.key().as_ref()],
        bump
    )]
    pub revenue_tracker: Account<'info, RevenueTracker>,
    
    pub agent: Signer<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordRevenue<'info> {
    #[account(
        mut,
        seeds = [b"revenue", agent.key().as_ref()],
        bump = revenue_tracker.bump
    )]
    pub revenue_tracker: Account<'info, RevenueTracker>,
    
    pub agent: Signer<'info>,
}
