#![allow(deprecated, unexpected_cfgs)]
pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("2s1Z1cmGHjP78wz4mbMSFQLBbFgSbpyj6XzZQdzDdiN8");

#[program]
pub mod blockbuster {

    use super::*;

    pub fn initialize(ctx: Context<Initialize>, seed: u64) -> Result<()> {
        ctx.accounts.initialize(seed, &ctx.bumps)?;
        Ok(())
    }

    pub fn report(ctx: Context<Report>, suspect: Pubkey) -> Result<()> {
        ctx.accounts.report(suspect)?;
        Ok(())
    }
}
