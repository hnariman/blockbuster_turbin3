use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub reward_rate: u64,
    pub seed: u64,
    pub locked: bool,
    pub mint_bump: u8,
    pub config_bump: u8,
}
