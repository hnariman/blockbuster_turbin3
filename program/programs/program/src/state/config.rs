use anchor_lang::prelude::*;

/*
* On init we remember admin: to do checks on lock & unlock
*
* mint & collection_mint: create mint, to grant access to detectives with NFT
* that allows doing checks in future if detective is a holder of one & has access
*
* reward_rate & vault:
*
* */

#[account]
#[derive(InitSpace)]
pub struct Config {
    // lock/unlock reqs
    pub admin: Pubkey,
    pub locked: bool,

    // grant access by NFT to detectives
    pub mint: Pubkey,
    pub collection_mint: Pubkey,

    // rewards to users, to promote?
    // or better charge users for checks?
    pub vault: Pubkey,
    pub reward_rate: u64,

    // bumps
    pub mint_bump: u8,
    pub config_bump: u8,
}

impl Config {
    pub const SIZE: usize = 90;
    // no longer 90 bytes, added fields, will recalculate when done with NFT's
}

