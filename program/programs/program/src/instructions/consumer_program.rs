use anchor_lang::prelude::*;
// use anchor_spl::{
//     associated_token::AssociatedToken,
//     token::{Mint, Token, TokenAccount},
// };
//
// use crate::{Case, Config, Report, CONF_SEED, MINT_SEED};
//
#[derive(Accounts)]
// #[instruction(suspect:Pubkey)]
pub struct CallReport<'a> {
    #[account(mut)]
    pub caller: Signer<'a>,
}
//
//     #[account(mut)]
//     pub case: Account<'a, Case>,
//
//     #[account( seeds =[CONF_SEED, config.key().as_ref()], bump= config.config_bump)]
//     pub config: Account<'a, Config>,
//
//     #[account( seeds = [MINT_SEED, config.key().as_ref()], bump = config.mint_bump)]
//     pub mint: Account<'a, Mint>,
//
//     #[account(mut, associated_token::authority=config, associated_token::mint=mint)]
//     pub vault: Account<'a, TokenAccount>,
//
//     #[account( mut, associated_token::mint = mint, associated_token::authority =caller )]
//     pub user_ata: Account<'a, TokenAccount>,
//
//     pub blockbuster_program: Program<'a, Report<'a>>,
//     pub system_program: Program<'a, System>,
//     pub token_program: Program<'a, Token>,
//     pub associated_token_program: Program<'a, AssociatedToken>,
// }
//
// impl<'a> CallReport<'a> {
//     pub fn check(&mut self, _suspect: Pubkey) -> Result<()> {
//         let _program = self.blockbuster_program.to_account_info();
//         let _accounts = Report {
//             user: self.caller.clone(),
//             config: self.config.clone(),
//             record: self.case.clone(),
//             suspicious_user: todo!(),
//             mint: self.mint,
//             vault: self.vault,
//             user_ata: self.user_ata,
//             system_program: self.system_program,
//             token_program: self.token_program,
//             associated_token_program: self.associated_token_program,
//         };
//
//         let ctx = CpiContext::new(_program, _accounts);
//         // blockbuster::
//
//         Ok(())
//     }
// }
