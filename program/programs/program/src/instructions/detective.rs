use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::Token};

use crate::{error::ErrorCode, Case, Config, Status, CONF_SEED, SUSPECT_SEED};

#[derive(Accounts)]
#[instruction(suspect:Pubkey)]
pub struct Detective<'a> {
    #[account(mut)]
    pub detective: Signer<'a>,

    #[account( seeds = [CONF_SEED,config.key().as_ref()], bump = config.config_bump)]
    pub config: Account<'a, Config>,

    #[account( mut, seeds = [SUSPECT_SEED, suspect.key().as_ref()], bump)]
    pub case: Account<'a, Case>,

    #[account( seeds = [SUSPECT_SEED, suspect.key().as_ref()], bump, constraint = false)]
    pub corrupt_detective: Option<Account<'a, Case>>,
    // will check if it is crooked cop and resign() pubkey if so?

    // PROGRAMS:
    pub system_program: Program<'a, System>,
    pub token_program: Program<'a, Token>,
    pub associated_token_program: Program<'a, AssociatedToken>,
}

impl<'a> Detective<'a> {
    pub fn bust(&mut self) -> Result<()> {
        if let Some(_corruption) = &self.corrupt_detective {
            return Err(ErrorCode::SuspiciousDetective.into());
        }
        self.case.status = Status::Busted;
        self.case.update()?;
        self.reward_detective()?;
        Ok(())
    }

    pub fn clear(&mut self) -> Result<()> {
        if let Some(_corruption) = &self.corrupt_detective {
            return Err(ErrorCode::SuspiciousDetective.into());
        }
        self.case.status = Status::Cleared;
        self.case.update()?;
        self.reward_detective()?;
        Ok(())
    }

    pub fn reward_detective(&mut self) -> Result<()> {
        msg!("Thank you!, promotion act is under active development.");
        msg!("We highly appreciate your patience.");
        Ok(())
    }
}
