use std::vec;

use anchor_lang::{prelude::*, solana_program::sysvar};

use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        mpl_token_metadata::{
            instructions::{
                CreateMasterEditionV3Cpi, CreateMasterEditionV3CpiAccounts,
                CreateMasterEditionV3InstructionArgs, CreateMetadataAccountV3Cpi,
                CreateMetadataAccountV3CpiAccounts, CreateMetadataAccountV3InstructionArgs,
                VerifyCollectionV1Cpi, VerifyCollectionV1CpiAccounts,
            },
            types::{Collection, Creator, DataV2},
        },
        MasterEditionAccount, Metadata, MetadataAccount,
    },
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};

use crate::{Config, CONF_SEED };

#[derive(Accounts)]
pub struct HR<'a> {
    #[account(mut)]
    pub admin: Signer<'a>,

    #[account( seeds = [CONF_SEED, admin.key().as_ref()], bump = config.config_bump)]
    pub config: Account<'a, Config>,

    #[account( constraint = collection_mint.key() == config.collection_mint)]
    pub collection_mint: Account<'a, Mint>,

    #[account(mut)]
    pub collection_metadata: Account<'a, MetadataAccount>,

    pub collection_master_edition: Account<'a, MasterEditionAccount>,

    pub detective_system_account: SystemAccount<'a>,

    pub mint: Account<'a, Mint>,
    #[account(
        init,
        payer=admin,
        associated_token::mint = mint,
        associated_token::authority = detective_system_account
    )]
    pub mint_ata: Account<'a, TokenAccount>,

    /// CHECK: some
    #[account(mut)]
    pub mint_metadata: UncheckedAccount<'a>,

    /// CHECK: some
    #[account(mut)]
    pub mint_master_edition: UncheckedAccount<'a>,

    pub system_program: Program<'a, System>,
    pub token_program: Program<'a, Token>,
    pub associated_token_program: Program<'a, AssociatedToken>,
    pub metadata_program: Program<'a, Metadata>, // Metaplex program

    /// CHECK: This shall work
    #[account(address = sysvar::instructions::id())]
    pub instructions: AccountInfo<'a>,
}

impl<'a> HR<'a> {
    pub fn make_detective(&mut self, detective: Pubkey) -> Result<()> {
        // mint NFT -> mint_to(detective);
        // create Metadata
        // verify NFT
        self.mint_nft()?;
        self.verify_collection()?;
        msg!("minting for : {}", detective.to_string());
        Ok(())
    }

    pub fn mint_nft(&mut self) -> Result<()> {
        let accounts = MintTo {
            mint: self.mint.to_account_info(),
            to: self.mint_ata.to_account_info(),
            authority: self.config.to_account_info(),
        };
        let seeds = &[
            CONF_SEED,
            &self.config.admin.to_bytes(),
            &[self.config.config_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            accounts,
            signer_seeds,
        );
        mint_to(ctx, 1)?;

        let metadata = &self.mint_metadata.to_account_info();
        let master_edition = &self.mint_master_edition.to_account_info();
        let mint = &self.mint.to_account_info();
        let authority = &self.config.to_account_info();
        let payer = &self.admin.to_account_info();
        let system_program = &self.system_program.to_account_info();
        let spl_token_program = &self.token_program.to_account_info();
        let spl_metadata_program = &self.metadata_program.to_account_info();
        let update_authority = (&self.config.to_account_info(), false);

        let creator = vec![Creator {
            address: self.config.key().clone(),
            verified: true,
            share: 100,
        }];

        let metadata_account = CreateMetadataAccountV3Cpi::new(
            spl_metadata_program,
            CreateMetadataAccountV3CpiAccounts {
                metadata,
                mint,
                mint_authority: authority, // &self.config.to_account_info(),
                payer,
                update_authority,
                system_program,
                rent: None,
            },
            CreateMetadataAccountV3InstructionArgs {
                data: DataV2 {
                    name: "NFT".to_owned(),
                    symbol: "NFT".to_owned(),
                    uri: "".to_owned(),
                    seller_fee_basis_points: 0,
                    creators: Some(creator),
                    collection: Some(Collection {
                        verified: false,
                        key: self.collection_mint.key(),
                    }),
                    uses: None,
                },
                is_mutable: true,
                collection_details: None,
            },
        );

        let seeds = &[
            CONF_SEED,
            &self.admin.key().to_bytes(),
            &[self.config.config_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        metadata_account.invoke_signed(signer_seeds)?;

        // create master edition
        let master_edition_account = CreateMasterEditionV3Cpi::new(
            spl_metadata_program,
            CreateMasterEditionV3CpiAccounts {
                edition: master_edition,
                update_authority: authority,
                mint_authority: authority,
                mint,
                payer,
                metadata,
                token_program: spl_token_program,
                system_program,
                rent: None,
            },
            CreateMasterEditionV3InstructionArgs {
                max_supply: Some(0),
            },
        );
        master_edition_account.invoke_signed(signer_seeds)?;

        Ok(())
    }

    pub fn verify_collection(&mut self) -> Result<()> {
        let metadata = &self.mint_metadata.to_account_info();
        let authority = &self.config.to_account_info();
        let collection_mint = &self.collection_mint.to_account_info();
        let collection_metadata = &self.collection_metadata.to_account_info();
        let collection_master_edition = &self.collection_master_edition.to_account_info();
        let system_program = &self.system_program.to_account_info();
        let sysvar_instructions = &self.instructions.to_account_info();
        let spl_metadata_program = &self.metadata_program.to_account_info();
        // let update_authority = (&self.config.to_account_info(), false);

        let seeds = &[
            CONF_SEED,
            &self.config.admin.to_bytes(),
            &[self.config.config_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let verify_collection = VerifyCollectionV1Cpi::new(
            spl_metadata_program,
            VerifyCollectionV1CpiAccounts {
                authority,
                delegate_record: None,
                metadata,
                collection_mint,
                collection_metadata: Some(collection_metadata),
                collection_master_edition: Some(collection_master_edition),
                system_program,
                sysvar_instructions,
            },
        );
        verify_collection.invoke_signed(signer_seeds)?;

        msg!("Collection Verified!");

        Ok(())
    }

    pub fn make_detective_core(&mut self)->Result<()>{
        // let plugins = vec![
        // ];
        // TODO: migrate to mpl-core 0.10.0 doesn't work with anchor 0.31.0

        Ok(())
    }
}
