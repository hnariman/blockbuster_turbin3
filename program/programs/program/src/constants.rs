use anchor_lang::prelude::*;

#[constant]
pub const SEED: &str = "anchor";
pub const SUSPECT_SEED: &'static [u8; 19] = b"blockbuster_suspect";
pub const MAX_REPORTS: u8 = 200;
pub const CONF_SEED: &'static [u8; 18] = b"blockbuster_config";
pub const MINT_SEED: &'static [u8; 16] = b"blockbuster_mint";
