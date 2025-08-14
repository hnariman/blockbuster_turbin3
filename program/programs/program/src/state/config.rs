use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub mint: Pubkey,
    // save collection mint
    pub vault: Pubkey,
    pub reward_rate: u64,
    pub locked: bool,
    pub mint_bump: u8,
    pub config_bump: u8,
    pub admin: Pubkey,
    pub collection_mint: Pubkey,
}


impl Config {
   pub const SIZE:usize = 90; 
}