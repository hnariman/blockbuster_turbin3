import * as anchor from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { setup } from "./setup"
import { COLLECTION_MINT_SEED, CONF_SEED, MINT_SEED } from "./const";
import { setupNFT } from "./setupNFT";
import { TSetupNFT } from "./types";
import { Blockbuster } from "./../target/types/blockbuster";

export type TSetupInitialize = {
  anchor: typeof anchor,
  provider: anchor.Provider,
  admin: anchor.Wallet,
  vault: PublicKey,
  config: PublicKey,
  mint: PublicKey,
  collectionMint: PublicKey,
  collectionMintATA: PublicKey,
  program: anchor.Program<Blockbuster>,
}

/**
 * @description find PDA's by seeds & ATA's
 *
 * @returns {Promise<TSetupInitialize>} basic setup to use in test()
 *
 * --- anchor, program, provider, admin, vault, config, mint
 * --- umi, creator, nftMint, collectionMint
 */
export function setupInitialize(): TSetupInitialize {
  const { program, provider, wallet: admin } = setup();

  const configSeeds = [Buffer.from(CONF_SEED), admin.payer.publicKey.toBuffer()];
  const config = PublicKey.findProgramAddressSync(configSeeds, program.programId)[0];

  const mintSeeds = [Buffer.from(MINT_SEED), config.toBuffer()];
  const mint = PublicKey.findProgramAddressSync(mintSeeds, program.programId)[0];

  const vault = getAssociatedTokenAddressSync(mint, config, true);

  const collectionMintSeed = [Buffer.from(COLLECTION_MINT_SEED), config.toBuffer()];
  const collectionMint = PublicKey.findProgramAddressSync(collectionMintSeed, program.programId)[0];

  const collectionMintATA = getAssociatedTokenAddressSync(collectionMint, config, true);
  return {
    anchor,
    provider,
    program,
    admin,
    vault,
    config,
    mint,
    collectionMint,
    collectionMintATA
  }
}


