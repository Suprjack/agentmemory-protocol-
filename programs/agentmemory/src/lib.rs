use anchor_lang::prelude::*;
use anchor_lang::solana_program::keccak;

declare_id!("AMem1111111111111111111111111111111111111111");

pub mod royalty;
use royalty::*;

#[program]
pub mod agentmemory {
    use super::*;

    /// Initialize an agent account with reputation tracking
    pub fn initialize_agent(
        ctx: Context<InitializeAgent>,
        agent_id: String,
    ) -> Result<()> {
        require!(agent_id.len() <= 64, ErrorCode::AgentIdTooLong);
        
        let agent = &mut ctx.accounts.agent;
        agent.agent_id = agent_id;
        agent.authority = ctx.accounts.authority.key();
        agent.reputation = 0;
        agent.total_logs = 0;
        agent.total_attestations = 0;
        agent.bump = ctx.bumps.agent;
        
        msg!("Agent initialized: {}", agent.agent_id);
        Ok(())
    }

    /// Log a decision with input and logic hashes
    pub fn log_decision(
        ctx: Context<LogDecision>,
        input_data: String,
        logic_data: String,
    ) -> Result<()> {
        require!(input_data.len() <= 256, ErrorCode::InputTooLong);
        require!(logic_data.len() <= 256, ErrorCode::LogicTooLong);
        
        let agent = &mut ctx.accounts.agent;
        let memory_log = &mut ctx.accounts.memory_log;
        let clock = Clock::get()?;
        
        // Compute hashes
        let input_hash = keccak::hash(input_data.as_bytes());
        let logic_hash = keccak::hash(logic_data.as_bytes());
        
        // Compute Merkle root (simple concat for MVP, can be upgraded)
        let mut combined = Vec::new();
        combined.extend_from_slice(input_hash.as_ref());
        combined.extend_from_slice(logic_hash.as_ref());
        let merkle_root = keccak::hash(&combined);
        
        memory_log.agent = agent.key();
        memory_log.input_hash = input_hash.to_bytes();
        memory_log.logic_hash = logic_hash.to_bytes();
        memory_log.merkle_root = merkle_root.to_bytes();
        memory_log.timestamp = clock.unix_timestamp;
        memory_log.is_attested = false;
        memory_log.bump = ctx.bumps.memory_log;
        
        agent.total_logs += 1;
        
        emit!(DecisionLogged {
            agent: agent.key(),
            merkle_root: merkle_root.to_bytes(),
            timestamp: clock.unix_timestamp,
        });
        
        msg!("Decision logged for agent: {}", agent.agent_id);
        Ok(())
    }

    /// Attest to the outcome of a logged decision
    pub fn attest_outcome(
        ctx: Context<AttestOutcome>,
        outcome_data: String,
        success: bool,
        score_delta: i64,
    ) -> Result<()> {
        require!(outcome_data.len() <= 256, ErrorCode::OutcomeTooLong);
        require!(!ctx.accounts.memory_log.is_attested, ErrorCode::AlreadyAttested);
        
        let agent = &mut ctx.accounts.agent;
        let memory_log = &mut ctx.accounts.memory_log;
        let attestation = &mut ctx.accounts.attestation;
        let clock = Clock::get()?;
        
        // Compute outcome hash
        let outcome_hash = keccak::hash(outcome_data.as_bytes());
        
        attestation.memory_log = memory_log.key();
        attestation.outcome_hash = outcome_hash.to_bytes();
        attestation.success = success;
        attestation.score_delta = score_delta;
        attestation.timestamp = clock.unix_timestamp;
        attestation.bump = ctx.bumps.attestation;
        
        memory_log.is_attested = true;
        
        // Update agent reputation (with bounds checking)
        let new_reputation = (agent.reputation as i64)
            .checked_add(score_delta)
            .ok_or(ErrorCode::ReputationOverflow)?;
        agent.reputation = new_reputation.max(0) as u64;
        agent.total_attestations += 1;
        
        emit!(OutcomeAttested {
            agent: agent.key(),
            memory_log: memory_log.key(),
            success,
            new_reputation: agent.reputation,
        });
        
        msg!("Outcome attested for agent: {}, new reputation: {}", 
             agent.agent_id, agent.reputation);
        Ok(())
    }

    // ============================================================================
    // Royalty System (Marketplace Revenue)
    // ============================================================================

    /// Initialize platform config (treasury + fees)
    pub fn initialize_platform(
        ctx: Context<royalty::InitializePlatform>,
        treasury: Pubkey,
        platform_fee_bps: u16,
        referral_fee_bps: u16,
    ) -> Result<()> {
        royalty::initialize_platform(ctx, treasury, platform_fee_bps, referral_fee_bps)
    }

    /// Register a new memory module for sale
    pub fn register_module(
        ctx: Context<royalty::RegisterModule>,
        module_id: String,
        price_lamports: u64,
        royalty_bps: u16,
        ipfs_hash: String,
    ) -> Result<()> {
        royalty::register_module(ctx, module_id, price_lamports, royalty_bps, ipfs_hash)
    }

    /// Purchase a module (triggers royalty distribution)
    pub fn purchase_module(
        ctx: Context<royalty::PurchaseModule>,
        referrer: Option<Pubkey>,
    ) -> Result<()> {
        royalty::purchase_module(ctx, referrer)
    }

    /// Update module pricing
    pub fn update_module_pricing(
        ctx: Context<royalty::UpdateModulePricing>,
        new_price: u64,
        new_royalty_bps: u16,
    ) -> Result<()> {
        royalty::update_module_pricing(ctx, new_price, new_royalty_bps)
    }

    /// Deactivate module from marketplace
    pub fn deactivate_module(ctx: Context<royalty::DeactivateModule>) -> Result<()> {
        royalty::deactivate_module(ctx)
    }
}

// ============================================================================
// Account Structures
// ============================================================================

#[account]
pub struct AgentAccount {
    pub agent_id: String,        // Max 64 chars
    pub authority: Pubkey,        // Owner/controller
    pub reputation: u64,          // Reputation score
    pub total_logs: u64,          // Total decisions logged
    pub total_attestations: u64,  // Total attested outcomes
    pub bump: u8,                 // PDA bump
}

#[account]
pub struct MemoryLog {
    pub agent: Pubkey,            // Agent account
    pub input_hash: [u8; 32],     // Keccak256 of input
    pub logic_hash: [u8; 32],     // Keccak256 of logic
    pub merkle_root: [u8; 32],    // Merkle root of decision tree
    pub timestamp: i64,           // Unix timestamp
    pub is_attested: bool,        // Has outcome been attested?
    pub bump: u8,                 // PDA bump
}

#[account]
pub struct Attestation {
    pub memory_log: Pubkey,       // Memory log reference
    pub outcome_hash: [u8; 32],   // Keccak256 of outcome
    pub success: bool,            // Was outcome successful?
    pub score_delta: i64,         // Reputation change
    pub timestamp: i64,           // Unix timestamp
    pub bump: u8,                 // PDA bump
}

// ============================================================================
// Context Structures
// ============================================================================

#[derive(Accounts)]
#[instruction(agent_id: String)]
pub struct InitializeAgent<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 68 + 32 + 8 + 8 + 8 + 1,  // discriminator + agent_id + pubkeys + counters + bump
        seeds = [b"agent", agent_id.as_bytes()],
        bump
    )]
    pub agent: Account<'info, AgentAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LogDecision<'info> {
    #[account(
        mut,
        seeds = [b"agent", agent.agent_id.as_bytes()],
        bump = agent.bump,
        has_one = authority
    )]
    pub agent: Account<'info, AgentAccount>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 32 + 32 + 8 + 1 + 1,  // discriminator + pubkeys + hashes + timestamp + bool + bump
        seeds = [b"memory", agent.key().as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub memory_log: Account<'info, MemoryLog>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AttestOutcome<'info> {
    #[account(
        mut,
        seeds = [b"agent", agent.agent_id.as_bytes()],
        bump = agent.bump
    )]
    pub agent: Account<'info, AgentAccount>,
    
    #[account(
        mut,
        has_one = agent
    )]
    pub memory_log: Account<'info, MemoryLog>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 1 + 8 + 8 + 1,  // discriminator + pubkeys + hash + bool + score + timestamp + bump
        seeds = [b"attest", memory_log.key().as_ref()],
        bump
    )]
    pub attestation: Account<'info, Attestation>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

// ============================================================================
// Events
// ============================================================================

#[event]
pub struct DecisionLogged {
    pub agent: Pubkey,
    pub merkle_root: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct OutcomeAttested {
    pub agent: Pubkey,
    pub memory_log: Pubkey,
    pub success: bool,
    pub new_reputation: u64,
}

// ============================================================================
// Error Codes
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Agent ID too long (max 64 chars)")]
    AgentIdTooLong,
    #[msg("Input data too long (max 256 chars)")]
    InputTooLong,
    #[msg("Logic data too long (max 256 chars)")]
    LogicTooLong,
    #[msg("Outcome data too long (max 256 chars)")]
    OutcomeTooLong,
    #[msg("Memory log already attested")]
    AlreadyAttested,
    #[msg("Reputation calculation overflow")]
    ReputationOverflow,
}
