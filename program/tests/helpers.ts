import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Blockbuster } from "../target/types/blockbuster";
import { Keypair, PublicKey, Signer, SystemProgram } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import assert from "node:assert";

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

export function setup() {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Blockbuster as Program<Blockbuster>;
  const provider = anchor.getProvider();
  const wallet = provider.wallet as anchor.Wallet;

  return { program, provider, wallet }
}

async function airDrop(provider: anchor.Provider, user: PublicKey, amount: Number) {
  const LAMPORTS_PER_SOL = 1e9;

  const { blockhash, lastValidBlockHeight } = await provider.connection.getLatestBlockhash();

  const signature = await provider.connection.requestAirdrop(user, (LAMPORTS_PER_SOL * +amount));

  await provider.connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });

  const balanceSOL = (await provider.connection.getAccountInfo(user)).lamports / LAMPORTS_PER_SOL;

  assert.equal(balanceSOL, amount);
}


export async function setupInitialize() {
  const { program, provider, wallet } = setup();

  const configSeeds = [Buffer.from("blockbuster_config"), wallet.publicKey.toBuffer()];
  const config = PublicKey.findProgramAddressSync(configSeeds, program.programId)[0];

  const mintSeeds = [Buffer.from("blockbuster_mint"), config.toBuffer()];
  const mint = PublicKey.findProgramAddressSync(mintSeeds, program.programId)[0];

  const vault = getAssociatedTokenAddressSync(mint, config, true);

  return { wallet, vault, config, anchor, program, mint, provider }
}


export async function setupCitizen() {
  const { program, provider, wallet } = setup();
  const user = Keypair.generate();
  const suspect = Keypair.generate().publicKey;

  const configSeed = [Buffer.from("blockbuster_config"), wallet.publicKey.toBuffer()];
  const config = PublicKey.findProgramAddressSync(configSeed, program.programId)[0];

  const mintSeeds = [Buffer.from("blockbuster_mint"), config.toBuffer()];
  const mint = PublicKey.findProgramAddressSync(mintSeeds, program.programId)[0];

  const recordSeed = [Buffer.from("blockbuster_suspect"), suspect.toBuffer()];
  const record = PublicKey.findProgramAddressSync(recordSeed, program.programId)[0];

  const vault = getAssociatedTokenAddressSync(mint, config, true);
  const userAta = getAssociatedTokenAddressSync(mint, user.publicKey, true);

  await airDrop(provider, user.publicKey, 12);

  const accounts: Partial<ReportAccounts> = {
    user: user.publicKey,
    config,
    mint,
    vault,
    record,
    userAta,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
  }

  return {
    wallet,
    program,
    provider,
    config,
    mint,
    suspect,
    record,
    vault,
    userAta,
    accounts,
    user
  }
}



export async function setupDetective() {
  const { program, provider, wallet } = setup();
  const detective = Keypair.generate();
  const suspect = Keypair.generate().publicKey;

  const configSeed = [Buffer.from("blockbuster_config"), wallet.publicKey.toBuffer()];
  const config = PublicKey.findProgramAddressSync(configSeed, program.programId)[0];

  const mintSeeds = [Buffer.from("blockbuster_mint"), config.toBuffer()];
  const mint = PublicKey.findProgramAddressSync(mintSeeds, program.programId)[0];

  const recordSeed = [Buffer.from("blockbuster_suspect"), suspect.toBuffer()];
  const record = PublicKey.findProgramAddressSync(recordSeed, program.programId)[0];

  const vault = getAssociatedTokenAddressSync(mint, config, true);
  const userAta = getAssociatedTokenAddressSync(mint, detective.publicKey, true);

  await airDrop(provider, detective.publicKey, 12);

  const accounts: Partial<ReportAccounts & { detective: PublicKey }> = {
    detective: detective.publicKey,
    config,
    mint,
    record,
    suspect,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
  }

  return {
    wallet,
    program,
    provider,
    config,
    mint,
    record,
    suspect,
    accounts,
    detective
  }
}
