use anchor_lang::prelude::*;

#[constant]
pub const MAX_REPORTS: u8 = 200;
pub const SUSPECT_SEED:  &[u8] = b"blockbuster_suspect";
pub const CONF_SEED: &[u8] = b"blockbuster_config";
pub const MINT_SEED: &[u8] = b"blockbuster_mint";
pub const COLLECTION_MINT_SEED: &[u8] = b"blockbuster_collection_mint";
