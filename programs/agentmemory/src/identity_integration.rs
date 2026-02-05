use anchor_lang::prelude::*;

/// Identity integration module for AgentMemory
/// Supports SAID (Solana Agent Identity) and other identity providers
/// 
/// Inspired by conversation with kai (Agent #15) on Colosseum forum
/// https://agents.colosseum.com/api/forum/posts/1374/comments

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum IdentityProvider {
    /// Solana Agent Identity (SAID) - verified agent identity
    SAID,
    /// Simple pubkey-based identity (default, no verification)
    Pubkey,
    /// Custom identity provider (extensible)
    Custom { provider: String },
}

#[account]
pub struct VerifiedIdentity {
    /// Agent public key
    pub agent: Pubkey,
    
    /// Identity provider used for verification
    pub provider: IdentityProvider,
    
    /// Verification credential (hash or reference)
    pub credential: [u8; 32],
    
    /// Timestamp of identity verification
    pub verified_at: i64,
    
    /// Expiry timestamp (0 = never expires)
    pub expires_at: i64,
    
    /// Verification status
    pub is_active: bool,
    
    /// Bump seed for PDA
    pub bump: u8,
}

impl VerifiedIdentity {
    pub const LEN: usize = 8 + // discriminator
        32 +  // agent
        33 +  // provider (enum + variant data)
        32 +  // credential
        8 +   // verified_at
        8 +   // expires_at
        1 +   // is_active
        1;    // bump
    
    /// Check if identity is currently valid
    pub fn is_valid(&self, current_time: i64) -> bool {
        if !self.is_active {
            return false;
        }
        
        if self.expires_at > 0 && current_time > self.expires_at {
            return false;
        }
        
        true
    }
    
    /// Verify SAID credential (placeholder - actual implementation depends on SAID spec)
    pub fn verify_said_credential(credential: &[u8; 32]) -> Result<bool> {
        // TODO: Implement actual SAID verification
        // This would:
        // 1. Decode the credential
        // 2. Verify signature against SAID registry
        // 3. Check credential hasn't been revoked
        // 4. Validate expiry
        
        // For now, just check it's not all zeros
        Ok(!credential.iter().all(|&b| b == 0))
    }
}

#[derive(Accounts)]
pub struct RegisterIdentity<'info> {
    #[account(
        init,
        payer = authority,
        space = VerifiedIdentity::LEN,
        seeds = [b"identity", agent.key().as_ref()],
        bump
    )]
    pub verified_identity: Account<'info, VerifiedIdentity>,
    
    pub agent: Signer<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeIdentity<'info> {
    #[account(
        mut,
        seeds = [b"identity", agent.key().as_ref()],
        bump = verified_identity.bump,
        has_one = agent
    )]
    pub verified_identity: Account<'info, VerifiedIdentity>,
    
    pub agent: Signer<'info>,
}

/// Integration functions for AgentMemory + Identity
pub mod integration {
    use super::*;
    
    /// Initialize agent with identity verification
    pub fn initialize_with_identity(
        ctx: Context<RegisterIdentity>,
        provider: IdentityProvider,
        credential: [u8; 32],
        expires_at: i64,
    ) -> Result<()> {
        let identity = &mut ctx.accounts.verified_identity;
        let clock = Clock::get()?;
        
        // Verify credential based on provider
        match provider {
            IdentityProvider::SAID => {
                require!(
                    VerifiedIdentity::verify_said_credential(&credential)?,
                    ErrorCode::InvalidSAIDCredential
                );
            },
            IdentityProvider::Pubkey => {
                // No verification needed for simple pubkey mode
            },
            IdentityProvider::Custom { .. } => {
                // Custom providers must implement their own verification
                // For now, accept any non-zero credential
                require!(
                    !credential.iter().all(|&b| b == 0),
                    ErrorCode::InvalidCredential
                );
            },
        }
        
        identity.agent = ctx.accounts.agent.key();
        identity.provider = provider;
        identity.credential = credential;
        identity.verified_at = clock.unix_timestamp;
        identity.expires_at = expires_at;
        identity.is_active = true;
        identity.bump = ctx.bumps.verified_identity;
        
        Ok(())
    }
    
    /// Revoke identity (disable)
    pub fn revoke(ctx: Context<RevokeIdentity>) -> Result<()> {
        let identity = &mut ctx.accounts.verified_identity;
        identity.is_active = false;
        Ok(())
    }
    
    /// Renew identity (extend expiry)
    pub fn renew(
        ctx: Context<RevokeIdentity>,
        new_expiry: i64,
        new_credential: [u8; 32],
    ) -> Result<()> {
        let identity = &mut ctx.accounts.verified_identity;
        let clock = Clock::get()?;
        
        // Verify new credential
        match &identity.provider {
            IdentityProvider::SAID => {
                require!(
                    VerifiedIdentity::verify_said_credential(&new_credential)?,
                    ErrorCode::InvalidSAIDCredential
                );
            },
            _ => {},
        }
        
        identity.credential = new_credential;
        identity.expires_at = new_expiry;
        identity.verified_at = clock.unix_timestamp;
        identity.is_active = true;
        
        Ok(())
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid SAID credential")]
    InvalidSAIDCredential,
    #[msg("Invalid identity credential")]
    InvalidCredential,
    #[msg("Identity has expired")]
    IdentityExpired,
    #[msg("Identity is not active")]
    IdentityNotActive,
}
