import * as anchor from "@coral-xyz/anchor";
import { Keypair as umiKeypair, KeypairSigner, Umi } from "@metaplex-foundation/umi";
import { Keypair, PublicKey, Signer } from "@solana/web3.js";

export interface IUserAirdrop {
  provider: anchor.Provider,
  user: Signer | Keypair,
  sol: number
};
export interface ReportAccounts {
  user: PublicKey, // Signer mut
  config: PublicKey, // PDA
  suspect: PublicKey,
  record: PublicKey, // PDA
  mint: PublicKey, // Mint of reward token
  vault: PublicKey, // not sure if required, if using mintTo & mint per each request
  userAta: PublicKey, // PDA
  // program ID's
  systemProgram: PublicKey,
  tokenProgram: PublicKey,
  associatedTokenProgram: PublicKey
};

export interface DetectiveAccounts {
  detective: PublicKey, // Signer mut
  config: PublicKey, // PDA
  record: PublicKey, // PDA
  mint: PublicKey, // reward token mint address
  vault: PublicKey, // PDA - not sure if still needed
  userAta: PublicKey, // PDA
  // program ID's:
  systemProgram: PublicKey,
  tokenProgram: PublicKey,
  associatedTokenProgram: PublicKey
}



