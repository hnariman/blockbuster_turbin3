use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::{Config, CONF_SEED, MINT_SEED};

#[derive(Accounts)]
pub struct Initialize<'a> {
    #[account(mut)]
    pub admin: Signer<'a>,

    #[account(
        init,
        payer = admin,
        space = 8 + Config::INIT_SPACE,
        seeds = [ CONF_SEED, admin.key().as_ref()],
        bump
    )]
    pub config: Account<'a, Config>,

    #[account(
        init,
        payer = admin,
        mint::decimals = 6,
        mint::authority = config,
        seeds = [MINT_SEED, config.key().as_ref()],
        bump
    )]
    pub mint: Account<'a, Mint>,

    #[account(
        init,
        payer = admin,
        associated_token::mint = mint,
        associated_token::authority = config
    )]
    pub vault: Account<'a, TokenAccount>,
    pub system_program: Program<'a, System>,
    pub token_program: Program<'a, Token>,
    pub associated_token_program: Program<'a, AssociatedToken>,
}

impl<'a> Initialize<'a> {
    pub fn initialize(&mut self, bumps: &InitializeBumps) -> Result<()> {
        msg!("we're in and we're testing");

        self.config.set_inner(Config {
            admin: self.admin.key(),
            reward_rate: 1u64,
            mint: self.mint.key(),
            vault: self.vault.key(),
            locked: false,
            config_bump: bumps.config,
            mint_bump: bumps.mint,
        });
        msg!("Initialization success!");

        Ok(())
    }
    // pub fn lock(&mut self) -> Result<()> {
    //     self.config.locked = true;
    //     Ok(())
    // }
}
