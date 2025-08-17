import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SendTransactionError, SystemProgram, } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

// native nodejs
import { it, describe, before } from "node:test";
import assert from "node:assert"

// files:
import { Blockbuster } from "../target/types/blockbuster";
import { airDrop, initNFT, setup, setupCitizen, setupInitialize, setupNFT } from "./helpers";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { createSignerFromKeypair, generateSigner, keypairIdentity, KeypairSigner, percentAmount, publicKey } from "@metaplex-foundation/umi";
import { createAndMint, createNft, findMasterEditionPda, findMetadataPda, mplTokenMetadata, verifySizedCollectionItem } from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fromWeb3JsKeypair, toWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";


// pub const MPL_TOKEN_METADATA_ID: Pubkey = pubkey!("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");


// let admin: PublicKey;
anchor.setProvider(anchor.AnchorProvider.env());
const program = anchor.workspace.Blockbuster as Program<Blockbuster>;
const provider = anchor.getProvider();
const connection = new anchor.web3.Connection(provider.connection.rpcEndpoint, "finalized");

// Helper function to log a message  
const logTransactionURL = async (signature: string): Promise<void> => {
  console.log(
    "Your transaction signature:\n"
    + "https://explorer.solana.com/transaction/"
    + signature
    + "?cluster=custom&customUrl="
    + provider.connection.rpcEndpoint
    + "\n"
  );
};


describe("Initialize", () => {
  let provider;
  let admin;
  let config;
  let mint;
  let vault;
  let user;

  let umi;
  let creator;
  let nftMint: KeypairSigner;
  let collectionMint: KeypairSigner;


  before(async () => {
    const { program, wallet } = setup();
    // ACCOUNTS:
    provider = anchor.getProvider();
    admin = wallet;

    const configSeeds = [Buffer.from("blockbuster_config"), wallet.publicKey.toBuffer()];
    config = PublicKey.findProgramAddressSync(configSeeds, program.programId)[0];

    const mintSeeds = [Buffer.from("blockbuster_mint"), config.toBuffer()];
    mint = PublicKey.findProgramAddressSync(mintSeeds, program.programId)[0];

    vault = getAssociatedTokenAddressSync(mint, config, true);

    const nftSetup = await setupNFT(provider, connection);

    umi = nftSetup.umi;
    creator = nftSetup.creator;
    nftMint = nftSetup.nftMint
    collectionMint = nftSetup.collectionMint;

  })


  it("Shall be able to initialize protocol", async () => {

    console.log('simulatione uno!');
    try {
      await createNft(umi, {
        mint: collectionMint,
        name: "test1",
        symbol: "test1",
        uri: "https://test.com",
        sellerFeeBasisPoints: percentAmount(0),
        collectionDetails: { __kind: "V1", size: 10 },
      }).sendAndConfirm(umi, { send: { commitment: "finalized" } });
      console.log(`created NFT Collection with UMI: ${collectionMint.publicKey.toString()}`)


      // mint NFT to maker ATA:
      await createNft(umi, {
        mint: nftMint,
        name: "test",
        symbol: "test",
        uri: "https://test.com",
        sellerFeeBasisPoints: percentAmount(1),
        collection: {
          verified: false,
          key: collectionMint.publicKey
        },
        tokenOwner: publicKey(user.publicKey),
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
      }).sendAndConfirm(umi, { send: { commitment: "confirmed" } });
      console.log("NFT Verified");

      const collectionMintAta = (await getOrCreateAssociatedTokenAccount(
        provider.connection,
        provider.wallet.payer,
        new anchor.web3.PublicKey(nftMint.publicKey),
        provider.wallet.payer.publicKey
      ))

    // Action:
    const initAccounts = {
      admin: admin.payer.publicKey,
      config,
      mint,
      vault,
      masterEdition: collectionMasterEdition[0],
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    };

    const tx = await program
      .methods
      .initialize()
      .accountsPartial({ ...initAccounts })
      .rpc();
    // Aseert
    const configAccount = await program.account.config.fetch(config);
    assert.equal(configAccount.locked, false);
    logTransactionURL(tx)
    } catch (e) {
      if (e instanceof SendTransactionError) {
        console.log(e.logs);
      } else {
        console.log('is not send transaction error')
      }

    }
  });

});

describe.skip("Lock/Unlock:", () => {

  it("Admin shall be able to lock protocol", async () => {
    let { admin, program } = await setupInitialize();

    const config_seeds =
      [Buffer.from("blockbuster_config"), admin.publicKey.toBuffer()];

    const [config, _config_bump] =
      PublicKey.findProgramAddressSync(config_seeds, program.programId);

    const tx = await program.methods
      .lock()
      .accountsPartial({ admin: admin.publicKey, config })
      .signers([admin.payer])
      .rpc();

    logTransactionURL(tx);

    const configAccount = await program.account.config.fetch(config);
    console.log("admin locks protocol");
    assert.equal(configAccount.locked, true);
  });

  it("Non-Admin shall not be able to lock protocol", async () => {
    const nonAdmin = Keypair.generate();
    let { config, program } = await setupInitialize();
    try {

      await program.methods
        .lock()
        .accountsPartial({ admin: nonAdmin.publicKey, config })
        .rpc();

      const configAccount = await program.account.config.fetch(config);
      assert.equal(configAccount.locked, true);
      assert.fail("this instruction shall fail")
    } catch (e) {
      assert.match(e.message, /Signature verification failed./);
    }
  });

  it("Admin shall be able to unlock protocol", async () => {
    let { config, program, provider, admin } = await setupInitialize();

    await program.methods
      .lock()
      .accountsPartial({ admin: admin.publicKey, config })
      .rpc();

    const configAccount = await program.account.config.fetch(config);
    assert.equal(configAccount.locked, false);
  });

  it.skip("Non-admin: shall not be able to unlock protocol", async () => {
    const nonAdmin = Keypair.generate();
    let { config, program } = await setupInitialize();

    try {

      await program.methods
        .lock()
        .accountsPartial({ admin: nonAdmin.publicKey, config })
        .rpc();

      assert.fail("this instruction shall fail")
    } catch (e) {
      assert.match(e.message, /Signature verification failed./);
    }
  });
})


describe.skip("Actor: Citizen", () => {

  it("Citizen shall be able to report new case address", async () => {
    const { accounts, user, suspect } = await setupCitizen();

    const tx = await program
      .methods
      .report(suspect)
      .accounts(accounts)
      .signers([user])
      .rpc();
    logTransactionURL(tx);

    // const record = await program.account.case.fetch(accounts.record);

    // assert.equal(record.count, 1);
    // console.log({ record });
    const tx2 = await program
      .methods
      .report(suspect)
      .accounts(accounts)
      .signers([user])
      .rpc();

    const record2 = await program.account.case.fetch(accounts.record);
    assert.equal(record2.count, 2);
    logTransactionURL(tx2);
  });

  it("Citizen shall increase counter & get notified when reporting existing address", async () => {
    const { accounts, user, suspect } = await setupCitizen();

    const reportSuspect1 = await program.methods
      .report(suspect)
      .accountsPartial(accounts)
      .signers([user])
      .rpc();
    const counter = program.account.case.fetch(accounts.record);

    logTransactionURL(reportSuspect1);
  });

  it("Citizen shall not be able to report own address", async () => {
    const { accounts, user, suspect } = await setupCitizen();
    accounts.record = PublicKey.findProgramAddressSync(
      [Buffer.from("blockbuster_suspect"), user.publicKey.toBuffer()], program.programId)[0];

    const reportSelf = await program.methods
      .report(user.publicKey)
      .accountsPartial(accounts)
      .signers([user])
      .rpc();

    logTransactionURL(reportSelf);
  });

  it.skip("Citizen shall not be able to report address in busted list", async () => {
    // const { accounts,user, suspect} = await setupCitizen(); 
    // const detective = Keypair.generate();
    // ctx.setRecord(suspect);

    // const userReportsAddress= await program.methods
    //   .report(suspect)
    //   .accountsPartial({ ...ctx.getAccounts() })
    //   .signers([ctx.user])
    //   .rpc();
    // logTransactionURL(userReportsAddress);

    // // TODO: add instruction for Detective to move address into busted list
    // const detectiveBustsAddress = await program.methods
    //   .report(suspect)
    //   .accountsPartial({ ...ctx.getAccounts() })
    //   .signers([detective])
    //   .rpc();
    // logTransactionURL(detectiveBustsAddress);

    // const userReportsAddressAgain = await program.methods
    //   .report(ctx.user.publicKey)
    //   .accountsPartial({ ...ctx.getAccounts() })
    //   .signers([ctx.user])
    //   .rpc();
    // logTransactionURL(userReportsAddressAgain);

  });

  it("Citizen shall not be able to report address in allow-list", () => {
    // detective: add pubkey
    // detective: allowlist the pubkey
    // citizen: try to report the pubkey
    // assert: failed
    throw new Error("Not Implemented");
  });
  it("Citizen shall not be able to report anything if citizen is suspect", () => {
    throw new Error("Not Implemented");
  });
  it("Citizen shall not be able to report anything if citizen is busted", () => {
    throw new Error("Not Implemented");
  });
});
