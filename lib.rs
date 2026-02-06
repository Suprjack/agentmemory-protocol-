use anchor_lang::prelude::*;

declare_id!("AgMemXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"); // Will be replaced after build

#[program]
pub mod agent_memory {
    use super::*;

    /// Initialize platform config (run once by authority)
    pub fn initialize(
        ctx: Context<Initialize>,
        platform_fee_pct: u8,
        royalty_pct: u8,
    ) -> Result<()> {
        require!(platform_fee_pct <= 20, ErrorCode::FeeTooHigh);
        require!(royalty_pct <= 20, ErrorCode::RoyaltyTooHigh);

        let config = &mut ctx.accounts.platform_config;
        config.authority = ctx.accounts.authority.key();
        config.platform_fee_pct = platform_fee_pct;
        config.royalty_pct = royalty_pct;
        config.fee_collector = ctx.accounts.fee_collector.key();

        msg!("Platform initialized: fee={}% royalty={}%", platform_fee_pct, royalty_pct);
        Ok(())
    }

    /// Register a new memory module
    pub fn register_module(
        ctx: Context<RegisterModule>,
        module_id: String,
        name: String,
        description: String,
        price: u64,
        ipfs_hash: String,
        category: ModuleCategory,
    ) -> Result<()> {
        require!(price > 0, ErrorCode::InvalidPrice);
        require!(module_id.len() <= 64, ErrorCode::IdTooLong);
        require!(name.len() <= 128, ErrorCode::NameTooLong);
        require!(ipfs_hash.starts_with("Qm") || ipfs_hash.starts_with("bafy"), ErrorCode::InvalidIpfsHash);

        let module = &mut ctx.accounts.module;
        module.module_id = module_id.clone();
        module.creator = ctx.accounts.creator.key();
        module.name = name.clone();
        module.description = description;
        module.price = price;
        module.ipfs_hash = ipfs_hash;
        module.category = category;
        module.created_at = Clock::get()?.unix_timestamp;
        module.total_purchases = 0;
        module.total_revenue = 0;

        emit!(ModuleRegistered {
            module_id,
            creator: module.creator,
            price,
        });

        msg!("Module registered: {} by {}", name, module.creator);
        Ok(())
    }

    /// Purchase a memory module
    pub fn purchase_module(
        ctx: Context<PurchaseModule>,
    ) -> Result<()> {
        let module = &mut ctx.accounts.module;
        let config = &ctx.accounts.platform_config;
        let price = module.price;

        // Calculate fees
        let platform_fee = (price * config.platform_fee_pct as u64) / 100;
        let royalty = (price * config.royalty_pct as u64) / 100;
        let creator_amount = price - platform_fee - royalty;

        // Transfer SOL from buyer to creator
        let transfer_to_creator = anchor_lang::system_program::Transfer {
            from: ctx.accounts.buyer.to_account_info(),
            to: ctx.accounts.creator.to_account_info(),
        };
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                transfer_to_creator,
            ),
            creator_amount,
        )?;

        // Transfer platform fee
        let transfer_to_platform = anchor_lang::system_program::Transfer {
            from: ctx.accounts.buyer.to_account_info(),
            to: ctx.accounts.fee_collector.to_account_info(),
        };
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                transfer_to_platform,
            ),
            platform_fee,
        )?;

        // Update module stats
        module.total_purchases += 1;
        module.total_revenue += price;

        // Record purchase
        let purchase = &mut ctx.accounts.purchase;
        purchase.user = ctx.accounts.buyer.key();
        purchase.module_id = module.module_id.clone();
        purchase.purchased_at = Clock::get()?.unix_timestamp;

        emit!(ModulePurchased {
            module_id: module.module_id.clone(),
            buyer: purchase.user,
            price,
            timestamp: purchase.purchased_at,
        });

        msg!("Module purchased: {} by {} for {} lamports", module.name, purchase.user, price);
        Ok(())
    }
}

// Contexts

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + PlatformConfig::LEN,
        seeds = [b"config"],
        bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: Fee collector wallet
    pub fee_collector: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(module_id: String)]
pub struct RegisterModule<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + MemoryModule::LEN,
        seeds = [b"module", module_id.as_bytes()],
        bump
    )]
    pub module: Account<'info, MemoryModule>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PurchaseModule<'info> {
    #[account(
        mut,
        seeds = [b"module", module.module_id.as_bytes()],
        bump
    )]
    pub module: Account<'info, MemoryModule>,
    #[account(
        init,
        payer = buyer,
        space = 8 + UserPurchase::LEN,
        seeds = [b"purchase", buyer.key().as_ref(), module.module_id.as_bytes()],
        bump
    )]
    pub purchase: Account<'info, UserPurchase>,
    #[account(
        seeds = [b"config"],
        bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK: Creator receives payment
    #[account(mut)]
    pub creator: AccountInfo<'info>,
    /// CHECK: Fee collector
    #[account(mut)]
    pub fee_collector: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

// Data Structures

#[account]
pub struct MemoryModule {
    pub module_id: String,        // 64 bytes max
    pub creator: Pubkey,           // 32 bytes
    pub name: String,              // 128 bytes max
    pub description: String,       // 256 bytes max
    pub price: u64,                // 8 bytes
    pub ipfs_hash: String,         // 64 bytes max
    pub category: ModuleCategory,  // 1 byte
    pub created_at: i64,           // 8 bytes
    pub total_purchases: u64,      // 8 bytes
    pub total_revenue: u64,        // 8 bytes
}

impl MemoryModule {
    pub const LEN: usize = 64 + 32 + 128 + 256 + 8 + 64 + 1 + 8 + 8 + 8;
}

#[account]
pub struct UserPurchase {
    pub user: Pubkey,          // 32 bytes
    pub module_id: String,     // 64 bytes
    pub purchased_at: i64,     // 8 bytes
}

impl UserPurchase {
    pub const LEN: usize = 32 + 64 + 8;
}

#[account]
pub struct PlatformConfig {
    pub authority: Pubkey,      // 32 bytes
    pub platform_fee_pct: u8,   // 1 byte
    pub royalty_pct: u8,        // 1 byte
    pub fee_collector: Pubkey,  // 32 bytes
}

impl PlatformConfig {
    pub const LEN: usize = 32 + 1 + 1 + 32;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum ModuleCategory {
    BiTemporal,
    Procedural,
    Semantic,
    Episodic,
    Custom,
}

// Events

#[event]
pub struct ModuleRegistered {
    pub module_id: String,
    pub creator: Pubkey,
    pub price: u64,
}

#[event]
pub struct ModulePurchased {
    pub module_id: String,
    pub buyer: Pubkey,
    pub price: u64,
    pub timestamp: i64,
}

// Errors

#[error_code]
pub enum ErrorCode {
    #[msg("Platform fee cannot exceed 20%")]
    FeeTooHigh,
    #[msg("Royalty cannot exceed 20%")]
    RoyaltyTooHigh,
    #[msg("Price must be greater than 0")]
    InvalidPrice,
    #[msg("Module ID too long (max 64 chars)")]
    IdTooLong,
    #[msg("Name too long (max 128 chars)")]
    NameTooLong,
    #[msg("Invalid IPFS hash format")]
    InvalidIpfsHash,
}
