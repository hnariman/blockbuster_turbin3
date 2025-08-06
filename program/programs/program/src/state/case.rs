use anchor_lang::prelude::*;

use crate::{error::ErrorCode, MAX_REPORTS};

#[derive(Debug, Clone, Copy, AnchorDeserialize, AnchorSerialize)]
pub enum Status {
    Suspect,
    Busted,
    Cleared,
}

#[account]
pub struct Case {
    pub user: Pubkey,    // 32 bytes
    pub suspect: Pubkey, // 32 bytes
    pub count: u8,       // 1 byte
    pub status: Status,  // 1 byte
    pub created: i64,    // 8 bytes
    pub updated: i64,    // 8 bytes
} // including 8 bytes discriminator, Total Size = 90 bytes

type ResultNew = std::result::Result<Case, anchor_lang::error::Error>;

impl Case {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 1 + 8 + 8;

    pub fn new(user: Pubkey, suspect: Pubkey) -> ResultNew {
        Ok(Self {
            user,
            suspect,
            status: Status::Suspect,
            created: Clock::get()?.unix_timestamp,
            updated: Clock::get()?.unix_timestamp,
            count: 1,
        })
    }

    pub fn update(&mut self) -> Result<()> {
        // we don't increase counter, but still grant rewards
        if self.count < MAX_REPORTS {
            self.count.checked_add(1).ok_or(ErrorCode::CustomError)?;
        }

        // make sure we have most recent activity about suspect
        self.updated = Clock::get()?.unix_timestamp;
        Ok(())
    }
}
