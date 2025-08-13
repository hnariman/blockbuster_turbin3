use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, MintTo, Token, TokenAccount},
};

use crate::{case::Case, error::ErrorCode, Config, CONF_SEED, MINT_SEED, SUSPECT_SEED};

#[derive(Accounts)]
#[instruction(suspect:Pubkey)]
pub struct Report<'a> {
    #[account(mut)]
    pub user: Signer<'a>,

    #[account( 
        seeds = [CONF_SEED, config.admin.as_ref()],
        bump = config.config_bump
    )]
    pub config: Account<'a, Config>,

    #[account(
        init_if_needed,
        payer = user,
        space = Case::LEN,
        seeds = [SUSPECT_SEED, suspect.as_ref()],
        bump
    )]
    pub record: Account<'a, Case>,

    // suspicious exists if user pubkey was reported
    // #[account( 
    //     seeds = [SUSPECT_SEED, user.key().as_ref()], 
    //     bump, 
    //     constraint = false
    // )]
    // pub suspicious_user: Option<Account<'a, Case>>,

    /// CHECK: by design
    // pub suspicious_user: AccountInfo<'a>,

    // ACCS FOR PAYMENT:
    #[account( 
        mut,
        seeds = [MINT_SEED, config.key().as_ref()], 
        bump = config.mint_bump
    )] 
    pub mint: Account<'a, Mint>,

    #[account( 
        mut,
        associated_token::mint = mint,
        associated_token::authority = config
    )]
    pub vault: Account<'a, TokenAccount>,

    #[account( 
        init_if_needed,
        payer= user,
        associated_token::mint = mint,
        associated_token::authority = user
    )]
    pub user_ata: Account<'a, TokenAccount>,

    // PROGRAMS:
    pub system_program: Program<'a, System>,
    pub token_program: Program<'a, Token>,
    pub associated_token_program: Program<'a, AssociatedToken>,
}

impl<'a> Report<'a> {
    pub fn report(&mut self, suspect: Pubkey) -> Result<()> {
        // let existing_case =  
        // &self.suspicious_user.lamports() > 0 && 
        // !&self.suspicious_user.data_is_empty();

        // if existing_case {
        //     return Err(ErrorCode::SuspiciousUser.into());
        // }

        let case_exists = self.record.count > 0;
        if case_exists {
            self.record.count = self.record.count.checked_add(1).unwrap();
        } else {
            let case = Case::new(self.user.key(), suspect)?;
            self.record.set_inner(case);
        }

        self.reward()?;
        Ok(())
    }

    pub fn reward(&mut self) -> Result<()> {
        let program = self.token_program.to_account_info();

        let address = MintTo {
            mint: self.mint.to_account_info(),
            to: self.user_ata.to_account_info(),
            authority: self.config.to_account_info(),
        };

        let seeds = &[
            &CONF_SEED[..],
            &self.config.admin.to_bytes()[..], 
            &[self.config.config_bump]
        ];

        let signer_seeds = &[&seeds[..]];

        let ctx = CpiContext::new_with_signer(program, address, signer_seeds);

        anchor_spl::token::mint_to(ctx, self.config.reward_rate)?;
        Ok(())
    }
}
