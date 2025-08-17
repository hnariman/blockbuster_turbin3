import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Blockbuster } from "../target/types/blockbuster";
import { clusterApiUrl, Connection, Keypair, PublicKey, Signer, SystemProgram } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import assert from "node:assert";

import { createNft, findMasterEditionPda, findMetadataPda, mplTokenMetadata, verifySizedCollectionItem } from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

import {
  KeypairSigner,
  PublicKey as umiPublicKey,
  Keypair as umiKeypair,
  createSignerFromKeypair,
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,
  Umi
} from "@metaplex-foundation/umi";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { fromWeb3JsKeypair, toWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";

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
  const wallet = provider.wallet as NodeWallet;
  return { program, provider, wallet }
}


export function umiSetup(provider: anchor.Provider) {
  const wal = provider.wallet as NodeWallet;
  const umi = createUmi(provider.connection.rpcEndpoint);
  const nftMint: KeypairSigner = generateSigner(umi);
  const collectionMint: KeypairSigner = generateSigner(umi);
  const creatorWallet = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wal.payer.secretKey));
  const creator = createSignerFromKeypair(umi, creatorWallet);
  umi.use(keypairIdentity(creator)).use(mplTokenMetadata());

  return {
    umi,
    nftMint,
    collectionMint,
    creatorWallet,
    creator,
    provider,
  }
}


export async function initNFT(provider: anchor.Provider) {
  // const { collectionMint, umi, nftMint, creator, creatorWallet } = umiSetup(provider);

  const wal = provider.wallet as NodeWallet;
  const umi = createUmi(provider.connection.rpcEndpoint);

  const nftMint: KeypairSigner = generateSigner(umi);
  const collectionMint: KeypairSigner = generateSigner(umi);

  const creatorWallet = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wal.payer.secretKey));
  const creator = createSignerFromKeypair(umi, creatorWallet);

  umi.use(keypairIdentity(creator))
  umi.use(mplTokenMetadata());

  await airDrop(provider, toWeb3JsPublicKey(collectionMint.publicKey), 2);
  await airDrop(provider, provider.wallet.publicKey, 2);
  await airDrop(provider, toWeb3JsPublicKey(creatorWallet.publicKey), 2);
  await airDrop(provider, toWeb3JsPublicKey(nftMint.publicKey), 2);
  // await airDrop(provider, provider.wallet.publicKey, 2);
  await createNft(umi, {
    mint: collectionMint,
    name: "test",
    symbol: "test",
    uri: "https://test.com",
    sellerFeeBasisPoints: percentAmount(1),
    collectionDetails: { __kind: "V1", size: 10 },
  }).sendAndConfirm(umi);
  console.log(`created NFT Collection with UMI: ${collectionMint.publicKey.toString()}`)

  // mint NFT to maker ATA:
  await createNft(umi, {
    mint: nftMint,
    name: "test1",
    symbol: "test1",
    uri: "https://test.com",
    sellerFeeBasisPoints: percentAmount(1),
    collection: {
      verified: false,
      key: collectionMint.publicKey
    },
    tokenOwner: publicKey(provider.wallet.payer.publicKey),
  }).sendAndConfirm(umi, { send: { commitment: "finalized" } });
  console.log(`NFT created with UMI: ${nftMint.publicKey.toString()}`);

  // verify collection
  const collectionMeta = findMetadataPda(umi, { mint: collectionMint.publicKey });
  const collectionMasterEdition = findMasterEditionPda(umi, { mint: collectionMint.publicKey });
  const nftMeta = findMetadataPda(umi, { mint: nftMint.publicKey });

  await verifySizedCollectionItem(umi, {
    metadata: nftMeta,
    collectionAuthority: creator,
    collectionMint: collectionMint.publicKey,
    collection: collectionMeta,
    collectionMasterEditionAccount: collectionMasterEdition
  }).sendAndConfirm(umi, { send: { commitment: "finalized" } });
  console.log("NFT Verified");


  const collectionMintAta = (await getOrCreateAssociatedTokenAccount(
    provider.connection,
    provider.wallet.payer,
    new anchor.web3.PublicKey(nftMint.publicKey),
    provider.wallet.payer.publicKey
  ))

  return {
    collectionMint,
    collectionMintAta,
    collectionMasterEdition,
    collectionMeta,
  }
}

export async function setupInitialize() {
  const { program, provider, wallet } = setup();
  const admin = wallet;

  const configSeeds = [Buffer.from("blockbuster_config"), wallet.publicKey.toBuffer()];
  const config = PublicKey.findProgramAddressSync(configSeeds, program.programId)[0];

  const mintSeeds = [Buffer.from("blockbuster_mint"), config.toBuffer()];
  const mint = PublicKey.findProgramAddressSync(mintSeeds, program.programId)[0];

  const vault = getAssociatedTokenAddressSync(mint, config, true);
  // const collectionMintSeed = [Buffer.from("blockbuster_collection_mint"), config.toBuffer()];
  // const collectionMint = PublicKey.findProgramAddressSync(collectionMintSeed, program.programId)[0];


  // const collectionMintAta = getAssociatedTokenAddressSync(collectionMint, config, true);

  /// UMI STUFF:

  // mint collection NFT

  return {
    anchor,
    provider,
    program,
    admin,
    vault,
    config,
    mint,


  }
}


export async function airDrop(provider: anchor.Provider, user: PublicKey, amount: Number) {
  const LAMPORTS_PER_SOL = 1e9;

  const { blockhash, lastValidBlockHeight } = await provider.connection.getLatestBlockhash();

  const signature = await provider.connection.requestAirdrop(user, (LAMPORTS_PER_SOL * +amount));

  await provider.connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature }, "confirmed");

  const balanceSOL = (await provider.connection.getAccountInfo(user)).lamports / LAMPORTS_PER_SOL;
  console.log({ balance: balanceSOL });

// assert.equal(balanceSOL, amount);
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
  await airDrop(provider, provider.wallet.publicKey, 12);

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


export type TSetupNFT = {
  umi: Umi,
  nftMint: KeypairSigner,
  collectionMint: KeypairSigner,
  creator: umiKeypair,
}

/**
 * @description 
 * setting up umi, nftMint & collectionMint
 * 
 * @since provider has connection, but umi doesn't like it,
 * so we have to either create or pass new Connection()
 * took few days to figure out & debug, sending love to umi devs here :)
 * 
 * @returns {Promise<TSetupNFT>} umi instance + funded accounts for NFT
*/
export async function setupNFT(provider: anchor.Provider, connection: Connection): Promise<TSetupNFT> {

  // user will pay for mpl thingies
  const user = Keypair.generate();
  await airDrop(provider, user.publicKey, 10000);

  // and got to setup connection to mplx
  const umi = createUmi(connection);

  // nft & collection are mutable accounts as they do pay
  const nftMint = generateSigner(umi);
  const collectionMint = generateSigner(umi);

  // so they need some funds
  await airDrop(provider, toWeb3JsPublicKey(nftMint.publicKey), 10000);
  await airDrop(provider, toWeb3JsPublicKey(collectionMint.publicKey), 10000);

  // now I'm not sure if user & creator are same thing :)
  // but deadline & don't touch if it works says: "leve it alone"
  const creator = fromWeb3JsKeypair(provider.wallet.payer);
  await airDrop(provider, toWeb3JsPublicKey(creator.publicKey), 10000);

  // traditional umi setup, plug identity (signer) and metadata
  // into umi middleware
  umi.use(keypairIdentity(fromWeb3JsKeypair(user)));
  umi.use(mplTokenMetadata());

  return {
    umi,
    nftMint,
    collectionMint,
    creator,
  }
}