#![allow(deprecated, unexpected_cfgs)]
pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("484oGzaSywdWJqTPLXSQjGPZU38YZgFuRsJCqdSq6xcY");

#[program]
pub mod blockbuster {

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.initialize(&ctx.bumps)?;
        Ok(())
    }

    pub fn lock(ctx: Context<Initialize>, _seed: u64) -> Result<()> {
        ctx.accounts.lock()?;
        Ok(())
    }

    pub fn report(ctx: Context<Report>, suspect: Pubkey) -> Result<()> {
        ctx.accounts.report(suspect)?;
        Ok(())
    }

    pub fn bust(ctx: Context<Detective>, suspect: Pubkey) -> Result<()> {
        ctx.accounts.bust(suspect.key())?;
        Ok(())
    }

    pub fn clear(ctx: Context<Detective>, suspect: Pubkey) -> Result<()> {
        ctx.accounts.clear(suspect.key())?;
        Ok(())
    }
}
