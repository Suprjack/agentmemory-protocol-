/// Royalty Distribution System for AgentMemory Protocol
/// 
/// Handles automatic royalty payments to module creators when agents purchase modules.
/// 
/// Features:
/// - Platform fee (5% to protocol treasury)
/// - Creator royalty (configurable, default 90%)
/// - Referral bonus (optional 5%)
/// - On-chain verification of module ownership

use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::system_instruction;

/// Module metadata account (stores pricing + royalty info)
#[account]
pub struct ModuleMetadata {
    pub module_id: String,          // Unique module identifier
    pub creator: Pubkey,             // Module creator (receives royalties)
    pub price_lamports: u64,         // Price in lamports
    pub royalty_bps: u16,            // Royalty basis points (e.g., 9000 = 90%)
    pub total_sales: u64,            // Total number of purchases
    pub total_revenue: u64,          // Total revenue generated
    pub ipfs_hash: String,           // Content hash (IPFS CID)
    pub is_active: bool,             // Can be purchased?
    pub bump: u8,
}

/// Module purchase record (proof of ownership)
#[account]
pub struct ModulePurchase {
    pub agent: Pubkey,               // Purchasing agent
    pub module: Pubkey,              // Module metadata PDA
    pub purchased_at: i64,           // Unix timestamp
    pub price_paid: u64,             // Lamports paid
    pub bump: u8,
}

/// Platform config (treasury + fee settings)
#[account]
pub struct PlatformConfig {
    pub authority: Pubkey,           // Protocol admin
    pub treasury: Pubkey,            // Treasury wallet
    pub platform_fee_bps: u16,       // Platform fee (500 = 5%)
    pub referral_fee_bps: u16,       // Referral bonus (500 = 5%)
    pub bump: u8,
}

// ============================================================================
// Instructions
// ============================================================================

/// Initialize platform config (one-time setup)
pub fn initialize_platform(
    ctx: Context<InitializePlatform>,
    treasury: Pubkey,
    platform_fee_bps: u16,
    referral_fee_bps: u16,
) -> Result<()> {
    require!(platform_fee_bps <= 1000, ErrorCode::FeeTooHigh); // Max 10%
    require!(referral_fee_bps <= 1000, ErrorCode::FeeTooHigh);
    
    let config = &mut ctx.accounts.platform_config;
    config.authority = ctx.accounts.authority.key();
    config.treasury = treasury;
    config.platform_fee_bps = platform_fee_bps;
    config.referral_fee_bps = referral_fee_bps;
    config.bump = ctx.bumps.platform_config;
    
    msg!("Platform initialized: treasury={}, platform_fee={}bps", treasury, platform_fee_bps);
    Ok(())
}

/// Register a new module (creator publishes content)
pub fn register_module(
    ctx: Context<RegisterModule>,
    module_id: String,
    price_lamports: u64,
    royalty_bps: u16,
    ipfs_hash: String,
) -> Result<()> {
    require!(module_id.len() <= 64, ErrorCode::ModuleIdTooLong);
    require!(ipfs_hash.len() <= 128, ErrorCode::IpfsHashTooLong);
    require!(royalty_bps <= 10000, ErrorCode::InvalidRoyalty); // Max 100%
    require!(price_lamports >= 1_000_000, ErrorCode::PriceTooLow); // Min 0.001 SOL
    
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
    
    msg!("Module registered: {} by {}", module.module_id, module.creator);
    Ok(())
}

/// Purchase a module (agent buys access + triggers royalty distribution)
pub fn purchase_module(
    ctx: Context<PurchaseModule>,
    referrer: Option<Pubkey>,
) -> Result<()> {
    let module = &mut ctx.accounts.module_metadata;
    let config = &ctx.accounts.platform_config;
    let clock = Clock::get()?;
    
    require!(module.is_active, ErrorCode::ModuleNotActive);
    
    let price = module.price_lamports;
    
    // Calculate splits
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
    
    // Transfer to treasury
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
    
    // Transfer to creator
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
    
    // Transfer referral bonus (if applicable)
    if let Some(referrer_key) = referrer {
        invoke(
            &system_instruction::transfer(
                ctx.accounts.buyer.key,
                &referrer_key,
                referral_fee,
            ),
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.referrer_wallet.as_ref().unwrap().to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
    }
    
    // Record purchase
    let purchase = &mut ctx.accounts.module_purchase;
    purchase.agent = ctx.accounts.agent.key();
    purchase.module = module.key();
    purchase.purchased_at = clock.unix_timestamp;
    purchase.price_paid = price;
    purchase.bump = ctx.bumps.module_purchase;
    
    // Update module stats
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
    
    msg!("Module purchased: {} by agent {}", module.module_id, ctx.accounts.agent.key());
    Ok(())
}

/// Update module pricing (creator can adjust)
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
    
    msg!("Module pricing updated: {} (price={}, royalty={}bps)", 
         module.module_id, new_price, new_royalty_bps);
    Ok(())
}

/// Deactivate module (creator removes from marketplace)
pub fn deactivate_module(ctx: Context<DeactivateModule>) -> Result<()> {
    let module = &mut ctx.accounts.module_metadata;
    module.is_active = false;
    
    msg!("Module deactivated: {}", module.module_id);
    Ok(())
}

// ============================================================================
// Context Structures
// ============================================================================

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
    pub agent: Account<'info, crate::AgentAccount>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    /// CHECK: Treasury wallet (receives platform fee)
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    
    /// CHECK: Creator wallet (receives royalty)
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
