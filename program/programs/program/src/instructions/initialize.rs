use std::vec;

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use mpl_core::{
    instructions::{CreateCollectionV1CpiBuilder, CreateV1CpiBuilder},
    types::{Attribute, Attributes, DataState, PluginAuthorityPair},
};

use crate::{Config, COLLECTION_MINT_SEED, CONF_SEED, MINT_SEED};

#[derive(Accounts)]
pub struct Initialize<'a> {
    #[account(mut)]
    pub admin: Signer<'a>,

    #[account(
        init,
        payer = admin,
        space = 8 + Config::INIT_SPACE,
        seeds = [ CONF_SEED, admin.key().as_ref()],
        bump
    )]
    pub config: Account<'a, Config>,

    #[account(
        init,
        payer = admin,
        mint::decimals = 6,
        mint::authority = config,
        seeds = [MINT_SEED, config.key().as_ref()],
        bump
    )]
    pub mint: Account<'a, Mint>,

    #[account(
        init,
        payer = admin,
        associated_token::mint = mint,
        associated_token::authority = config
    )]
    pub vault: Account<'a, TokenAccount>,

    // NFT part
    #[account(
        init,
        payer = admin,
        mint::decimals = 6,
        mint::authority = config,
        seeds = [COLLECTION_MINT_SEED, config.key().as_ref()],
        bump
    )]
    pub collection_mint: Account<'a, Mint>,

    #[account(
        init,
        payer=admin,
        associated_token::mint = collection_mint,
        associated_token::authority = config,
    )]
    pub collection_mint_ata: Account<'a, TokenAccount>,

    /// CHECK: not initialized yet
    #[account(mut)]
    pub master_edition: UncheckedAccount<'a>,

    /// CHECK: it's kind of fine for now
    #[account(mut)]
    pub metadata: UncheckedAccount<'a>,

    /// CHECK: This is the Collection Asset and will be checked by the Metaplex Core program
    #[account(mut)]
    pub collection: UncheckedAccount<'a>,

    /// CHECK: This is the ID of the Metaplex Core program
    #[account(address = mpl_core::ID)]
    pub mpl_core_program: UncheckedAccount<'a>,
    pub system_program: Program<'a, System>,
    pub token_program: Program<'a, Token>,
    pub associated_token_program: Program<'a, AssociatedToken>,
}

impl<'a> Initialize<'a> {
    pub fn initialize(&mut self, bumps: &InitializeBumps) -> Result<()> {
        msg!("we're in and we're testing");

        self.config.set_inner(Config {
            admin: self.admin.key(),
            reward_rate: 1u64,
            mint: self.mint.key(),
            vault: self.vault.key(),
            locked: false,
            config_bump: bumps.config,
            mint_bump: bumps.mint,
            collection_mint: self.collection_mint.key(),
        });
        msg!("created config & it's data ");

        self.mint_core(bumps)?;
        msg!("mint core OK");
        self.mint_core_collection(bumps)?;
        msg!("Initialization success!");
        Ok(())
    }

    pub fn mint_core(&mut self, bumps: &InitializeBumps) -> Result<()> {
        let plugins = vec![PluginAuthorityPair {
            plugin: mpl_core::types::Plugin::Attributes(Attributes {
                attribute_list: vec![Attribute {
                    key: "Ledger".to_string(),
                    value: "NFT".to_string(),
                }],
            }),
            authority: None,
        }];

        let seeds = &[CONF_SEED, self.admin.key.as_ref(), &[bumps.config]];
        let signer_seeds = &[&seeds[..]];

        CreateV1CpiBuilder::new(&self.mpl_core_program.to_account_info())
            .asset(&self.mint.to_account_info())
            .collection(Some(&self.collection_mint.to_account_info()))
            .authority(Some(&self.config.to_account_info()))
            .payer(&self.admin.to_account_info())
            .owner(Some(&self.admin.to_account_info()))
            .update_authority(None /* Some(&self.config.to_account_info()) */)
            .system_program(&self.system_program.to_account_info())
            .data_state(DataState::AccountState)
            .name("The Badge".to_string())
            .uri("https://myasset.com".to_string())
            .plugins(plugins)
            .invoke_signed(signer_seeds)?;

        Ok(())
    }

    pub fn mint_core_collection(&mut self, bumps: &InitializeBumps) -> Result<()> {
        let seeds = &[CONF_SEED, self.admin.key.as_ref(), &[bumps.config]];
        let signer_seeds = &[&seeds[..]];

        CreateCollectionV1CpiBuilder::new(&self.mpl_core_program.to_account_info())
            .collection(&self.collection.to_account_info())
            .update_authority(None /* Some(&self.config.to_account_info()) */)
            .payer(&self.admin.to_account_info())
            .system_program(&self.system_program.to_account_info())
            .name("BB Legder Collection".to_string())
            .uri("https://myasset.com".to_string())
            .invoke_signed(signer_seeds)?;

        Ok(())
    }
}
