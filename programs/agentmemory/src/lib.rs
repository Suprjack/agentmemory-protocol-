use anchor_lang::prelude::*;
use anchor_lang::solana_program::keccak;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::system_instruction;

declare_id!("EivtLAsC6pB2DJHd1MdSC9nYByVzcowJoUvqh9GmAjHc");

#[program]
pub mod agentmemory {
    use super::*;

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

        let input_hash = keccak::hash(input_data.as_bytes());
        let logic_hash = keccak::hash(logic_data.as_bytes());

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

    pub fn attest_outcome(
        ctx: Context<AttestOutcome>,
        outcome_data: String,
        success: bool,
        score_delta: i64,
    ) -> Result<()> {
        require!(outcome_data.len() <= 256, ErrorCode::OutcomeTooLong);
        require!(
            !ctx.accounts.memory_log.is_attested,
            ErrorCode::AlreadyAttested
        );

        let agent = &mut ctx.accounts.agent;
        let memory_log = &mut ctx.accounts.memory_log;
        let attestation = &mut ctx.accounts.attestation;
        let clock = Clock::get()?;

        let outcome_hash = keccak::hash(outcome_data.as_bytes());

        attestation.memory_log = memory_log.key();
        attestation.outcome_hash = outcome_hash.to_bytes();
        attestation.success = success;
        attestation.score_delta = score_delta;
        attestation.timestamp = clock.unix_timestamp;
        attestation.bump = ctx.bumps.attestation;

        memory_log.is_attested = true;

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

        msg!(
            "Outcome attested for agent: {}, new reputation: {}",
            agent.agent_id,
            agent.reputation
        );
        Ok(())
    }

    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        treasury: Pubkey,
        platform_fee_bps: u16,
        referral_fee_bps: u16,
    ) -> Result<()> {
        require!(platform_fee_bps <= 1000, ErrorCode::FeeTooHigh);
        require!(referral_fee_bps <= 1000, ErrorCode::FeeTooHigh);

        let config = &mut ctx.accounts.platform_config;
        config.authority = ctx.accounts.authority.key();
        config.treasury = treasury;
        config.platform_fee_bps = platform_fee_bps;
        config.referral_fee_bps = referral_fee_bps;
        config.bump = ctx.bumps.platform_config;

        msg!(
            "Platform initialized: treasury={}, fee={}bps",
            treasury,
            platform_fee_bps
        );
        Ok(())
    }

    pub fn register_module(
        ctx: Context<RegisterModule>,
        module_id: String,
        price_lamports: u64,
        royalty_bps: u16,
        ipfs_hash: String,
    ) -> Result<()> {
        require!(module_id.len() <= 64, ErrorCode::ModuleIdTooLong);
        require!(ipfs_hash.len() <= 128, ErrorCode::IpfsHashTooLong);
        require!(royalty_bps <= 10000, ErrorCode::InvalidRoyalty);
        require!(price_lamports >= 1_000_000, ErrorCode::PriceTooLow);

        let module = &mut ctx.accounts.module_metadata;
        module.module_id = module_id.clone();
        module.creator = ctx.accounts.creator.key();
        module.price_lamports = price_lamports;
        module.royalty_bps = royalty_bps;
        module.total_sales = 0;
        module.total_revenue = 0;
        module.ipfs_hash = ipfs_hash.clone();
        module.is_active = true;
        module.bump = ctx.bumps.module_metadata;

        emit!(ModuleRegistered {
            module: module.key(),
            module_id,
            creator: module.creator,
            price_lamports,
            ipfs_hash,
        });

        msg!(
            "Module registered: {} by {}",
            module.module_id,
            module.creator
        );
        Ok(())
    }

    pub fn purchase_module(
        ctx: Context<PurchaseModule>,
        referrer: Option<Pubkey>,
    ) -> Result<()> {
        let module = &mut ctx.accounts.module_metadata;
        let config = &ctx.accounts.platform_config;
        let clock = Clock::get()?;

        require!(module.is_active, ErrorCode::ModuleNotActive);

        let price = module.price_lamports;

        let platform_fee = (price as u128)
            .checked_mul(config.platform_fee_bps as u128)
            .unwrap()
            .checked_div(10_000)
            .unwrap() as u64;

        let referral_fee = if referrer.is_some() {
            (price as u128)
                .checked_mul(config.referral_fee_bps as u128)
                .unwrap()
                .checked_div(10_000)
                .unwrap() as u64
        } else {
            0
        };

        let creator_royalty = price
            .checked_sub(platform_fee)
            .unwrap()
            .checked_sub(referral_fee)
            .unwrap();

        invoke(
            &system_instruction::transfer(
                ctx.accounts.buyer.key,
                &config.treasury,
                platform_fee,
            ),
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.treasury.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        invoke(
            &system_instruction::transfer(
                ctx.accounts.buyer.key,
                &module.creator,
                creator_royalty,
            ),
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.creator_wallet.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        if let Some(referrer_key) = referrer {
            invoke(
                &system_instruction::transfer(
                    ctx.accounts.buyer.key,
                    &referrer_key,
                    referral_fee,
                ),
                &[
                    ctx.accounts.buyer.to_account_info(),
                    ctx.accounts
                        .referrer_wallet
                        .as_ref()
                        .unwrap()
                        .to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }

        let purchase = &mut ctx.accounts.module_purchase;
        purchase.agent = ctx.accounts.agent.key();
        purchase.module = module.key();
        purchase.purchased_at = clock.unix_timestamp;
        purchase.price_paid = price;
        purchase.bump = ctx.bumps.module_purchase;

        module.total_sales += 1;
        module.total_revenue += price;

        emit!(ModulePurchased {
            module: module.key(),
            agent: ctx.accounts.agent.key(),
            price_paid: price,
            platform_fee,
            creator_royalty,
            referral_fee,
        });

        msg!(
            "Module purchased: {} by agent {}",
            module.module_id,
            ctx.accounts.agent.key()
        );
        Ok(())
    }

    pub fn update_module_pricing(
        ctx: Context<UpdateModulePricing>,
        new_price: u64,
        new_royalty_bps: u16,
    ) -> Result<()> {
        require!(new_price >= 1_000_000, ErrorCode::PriceTooLow);
        require!(new_royalty_bps <= 10000, ErrorCode::InvalidRoyalty);

        let module = &mut ctx.accounts.module_metadata;
        module.price_lamports = new_price;
        module.royalty_bps = new_royalty_bps;

        msg!(
            "Module pricing updated: {} (price={}, royalty={}bps)",
            module.module_id,
            new_price,
            new_royalty_bps
        );
        Ok(())
    }

    pub fn deactivate_module(ctx: Context<DeactivateModule>) -> Result<()> {
        let module = &mut ctx.accounts.module_metadata;
        module.is_active = false;
        msg!("Module deactivated: {}", module.module_id);
        Ok(())
    }
}

// ============================================================================
// Account Structures
// ============================================================================

#[account]
pub struct AgentAccount {
    pub agent_id: String,
    pub authority: Pubkey,
    pub reputation: u64,
    pub total_logs: u64,
    pub total_attestations: u64,
    pub bump: u8,
}

#[account]
pub struct MemoryLog {
    pub agent: Pubkey,
    pub input_hash: [u8; 32],
    pub logic_hash: [u8; 32],
    pub merkle_root: [u8; 32],
    pub timestamp: i64,
    pub is_attested: bool,
    pub bump: u8,
}

#[account]
pub struct Attestation {
    pub memory_log: Pubkey,
    pub outcome_hash: [u8; 32],
    pub success: bool,
    pub score_delta: i64,
    pub timestamp: i64,
    pub bump: u8,
}

#[account]
pub struct ModuleMetadata {
    pub module_id: String,
    pub creator: Pubkey,
    pub price_lamports: u64,
    pub royalty_bps: u16,
    pub total_sales: u64,
    pub total_revenue: u64,
    pub ipfs_hash: String,
    pub is_active: bool,
    pub bump: u8,
}

#[account]
pub struct ModulePurchase {
    pub agent: Pubkey,
    pub module: Pubkey,
    pub purchased_at: i64,
    pub price_paid: u64,
    pub bump: u8,
}

#[account]
pub struct PlatformConfig {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub platform_fee_bps: u16,
    pub referral_fee_bps: u16,
    pub bump: u8,
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
        space = 8 + 68 + 32 + 8 + 8 + 8 + 1,
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
        space = 8 + 32 + 32 + 32 + 32 + 8 + 1 + 1,
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
        space = 8 + 32 + 32 + 1 + 8 + 8 + 1,
        seeds = [b"attest", memory_log.key().as_ref()],
        bump
    )]
    pub attestation: Account<'info, Attestation>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 2 + 2 + 1,
        seeds = [b"platform_config"],
        bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(module_id: String)]
pub struct RegisterModule<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + 68 + 32 + 8 + 2 + 8 + 8 + 132 + 1 + 1,
        seeds = [b"module", module_id.as_bytes()],
        bump
    )]
    pub module_metadata: Account<'info, ModuleMetadata>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PurchaseModule<'info> {
    #[account(
        mut,
        seeds = [b"module", module_metadata.module_id.as_bytes()],
        bump = module_metadata.bump
    )]
    pub module_metadata: Account<'info, ModuleMetadata>,

    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        init,
        payer = buyer,
        space = 8 + 32 + 32 + 8 + 8 + 1,
        seeds = [b"purchase", agent.key().as_ref(), module_metadata.key().as_ref()],
        bump
    )]
    pub module_purchase: Account<'info, ModulePurchase>,

    #[account(
        seeds = [b"agent", agent.agent_id.as_bytes()],
        bump = agent.bump
    )]
    pub agent: Account<'info, AgentAccount>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: Treasury wallet
    #[account(mut)]
    pub treasury: AccountInfo<'info>,

    /// CHECK: Creator wallet
    #[account(mut)]
    pub creator_wallet: AccountInfo<'info>,

    /// CHECK: Optional referrer wallet
    #[account(mut)]
    pub referrer_wallet: Option<AccountInfo<'info>>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateModulePricing<'info> {
    #[account(
        mut,
        seeds = [b"module", module_metadata.module_id.as_bytes()],
        bump = module_metadata.bump,
        has_one = creator
    )]
    pub module_metadata: Account<'info, ModuleMetadata>,

    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct DeactivateModule<'info> {
    #[account(
        mut,
        seeds = [b"module", module_metadata.module_id.as_bytes()],
        bump = module_metadata.bump,
        has_one = creator
    )]
    pub module_metadata: Account<'info, ModuleMetadata>,

    pub creator: Signer<'info>,
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

#[event]
pub struct ModuleRegistered {
    pub module: Pubkey,
    pub module_id: String,
    pub creator: Pubkey,
    pub price_lamports: u64,
    pub ipfs_hash: String,
}

#[event]
pub struct ModulePurchased {
    pub module: Pubkey,
    pub agent: Pubkey,
    pub price_paid: u64,
    pub platform_fee: u64,
    pub creator_royalty: u64,
    pub referral_fee: u64,
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
    #[msg("Module ID too long (max 64 chars)")]
    ModuleIdTooLong,
    #[msg("IPFS hash too long (max 128 chars)")]
    IpfsHashTooLong,
    #[msg("Invalid royalty percentage (max 100%)")]
    InvalidRoyalty,
    #[msg("Price too low (min 0.001 SOL)")]
    PriceTooLow,
    #[msg("Fee too high (max 10%)")]
    FeeTooHigh,
    #[msg("Module not active")]
    ModuleNotActive,
}
