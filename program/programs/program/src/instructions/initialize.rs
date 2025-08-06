use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::{Mint, Token, TokenAccount}};

use crate::{Config, CONF_SEED};

#[derive(Accounts)]
pub struct Initialize<'a> {
    #[account(mut)]
    pub admin: Signer<'a>,

    #[account(
        init,
        payer=admin,
        space=Config::INIT_SPACE,
        seeds=[CONF_SEED, admin.key().as_ref()],
        bump
    )]
    pub config: Account<'a, Config>,

    #[account(
        init,
        payer=admin,
        mint::decimals = 6,
        mint::authority = config,
        seeds = [b"mint", config.key().as_ref()],
        bump
    )]
    pub mint: Account<'a, Mint>,

    #[account(
        init, 
        payer=admin,
        associated_token::mint=mint,
        associated_token::authority=config
    )]
    pub vault: Account<'a, TokenAccount>,

    pub system_program:Program<'a, System>,
    pub token_program: Program<'a, Token>,
    pub associated_token_program: Program<'a, AssociatedToken>,
}

impl<'a> Initialize<'a> {
    pub fn initialize(&mut self, seed:u64, bumps:&InitializeBumps) -> Result<()> {
        self.config.set_inner(Config{ 
            reward_rate: 1u64,
            seed,
            locked: false,
            config_bump: bumps.config,
            mint_bump: bumps.mint
        });

        Ok(())
    }
}
