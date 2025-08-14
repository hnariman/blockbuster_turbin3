use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        mpl_token_metadata::{
            instructions::{
                CreateMasterEditionV3Cpi, CreateMasterEditionV3CpiAccounts,
                CreateMasterEditionV3InstructionArgs, CreateMetadataAccountV3Cpi,
                CreateMetadataAccountV3CpiAccounts, CreateMetadataAccountV3InstructionArgs,
            },
            types::{CollectionDetails, Creator, DataV2},
        },
        Metadata,
    },
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
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
        mint::freeze_authority = config,
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

    pub system_program: Program<'a, System>,
    pub token_program: Program<'a, Token>,
    pub associated_token_program: Program<'a, AssociatedToken>,
    pub metadata_program: Program<'a, Metadata>, // Metaplex program
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
        msg!("Initialization success!");
        // self.create_mint();
        Ok(())
    }

    pub fn create_mint(&mut self, bumps: &InitializeBumps) -> Result<()> {
        let accounts = MintTo {
            mint: self.collection_mint.to_account_info(),
            to: self.collection_mint_ata.to_account_info(),
            authority: self.config.to_account_info(),
        };
        let seeds = &[CONF_SEED, &self.admin.key().to_bytes(), &[bumps.config]];
        let signer_seeds = &[&seeds[..]];

        let ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            accounts,
            signer_seeds,
        );
        mint_to(ctx, 1)
    }

    pub fn create_metadata(&mut self, bumps: &InitializeBumps) -> Result<()> {
        // TODO: move to metaplex core to save compute units
        let creator = vec![Creator {
            address: self.config.key().clone(),
            verified: true,
            share: 100,
        }];
        let metadata = &self.metadata.to_account_info();
        let mint = &self.mint.to_account_info();
        let mint_authority = &self.config.to_account_info();
        let payer = &self.admin.to_account_info();
        let system_program = &self.system_program.to_account_info();
        let spl_metadata_program = &self.metadata_program.to_account_info();
        let update_authority = (&self.config.to_account_info(), false);

        let spl_token_program = &self.token_program.to_account_info();
        let master_edition = &self.master_edition.to_account_info();

        let metadata_account = CreateMetadataAccountV3Cpi::new(
            spl_metadata_program,
            CreateMetadataAccountV3CpiAccounts {
                metadata,
                mint,
                mint_authority,
                payer,
                update_authority,
                system_program,
                rent: None,
            },
            CreateMetadataAccountV3InstructionArgs {
                data: DataV2 {
                    name: "BBS".to_owned(),
                    symbol: "BBS".to_owned(),
                    uri: "".to_owned(),
                    seller_fee_basis_points: 0,
                    creators: Some(creator),
                    collection: None,
                    uses: None,
                },
                is_mutable: true,
                collection_details: Some(CollectionDetails::V1 { size: 0 }),
            },
        );

        let seeds = &[CONF_SEED, &self.admin.key().to_bytes(), &[bumps.config]];
        let signer_seeds = &[&seeds[..]];

        metadata_account.invoke_signed(signer_seeds)?;
        msg!("Metadata Account created!");

        let master_edition_account = CreateMasterEditionV3Cpi::new(
            spl_metadata_program,
            CreateMasterEditionV3CpiAccounts {
                edition: master_edition,
                update_authority: mint_authority,
                mint_authority,
                mint,
                payer,
                metadata,
                token_program: spl_token_program,
                system_program,
                rent: None,
            },
            CreateMasterEditionV3InstructionArgs {
                max_supply: Some(1),
            },
        );

        master_edition_account.invoke_signed(signer_seeds)?;

        msg!("Master Edition Account created");

        Ok(())
    }

    // pub fn lock(&mut self) -> Result<()> {
    //     self.config.locked = true;
    //     Ok(())
    // }
}
