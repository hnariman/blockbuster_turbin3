use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Custom error message")]
    CustomError,
    #[msg("Unable to create report")]
    SuspiciousUser,
    #[msg("Internal affairs investigation in progress")]
    SuspiciousDetective,
}
