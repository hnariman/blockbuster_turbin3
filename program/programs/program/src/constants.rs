use anchor_lang::prelude::*;

#[constant]
pub const SEED: &str = "anchor";
pub const SUSPECT_SEED: &'static [u8; 19] = b"blockbuster_suspect";
pub const MAX_REPORTS: u8 = 200;
pub const CONF_SEED: &'static [u8; 6] = b"config";
