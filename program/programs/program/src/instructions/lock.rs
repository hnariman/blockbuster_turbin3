use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::{Config, CONF_SEED, MINT_SEED};

#[derive(Accounts)]
pub struct Lock<'a> {
    #[account(mut)]
    pub admin: Signer<'a>,

    #[account(mut, seeds = [CONF_SEED, admin.key().as_ref()], bump)]
    pub config: Account<'a, Config>,

    #[account(
        mint::decimals = 6,
        mint::authority = config,
        seeds = [MINT_SEED, config.key().as_ref()],
        bump
    )]
    pub mint: Account<'a, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = config
    )]
    pub vault: Account<'a, TokenAccount>,
    pub system_program: Program<'a, System>,
    pub token_program: Program<'a, Token>,
    pub associated_token_program: Program<'a, AssociatedToken>,
}

impl<'a> Lock<'a> {
    pub fn lock_toggle(&mut self) -> Result<()> {
        self.config.locked = !self.config.locked;
        Ok(())
    }
}
