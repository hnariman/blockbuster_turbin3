import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey, SendTransactionError, SystemProgram, } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";

// native nodejs
import assert from "node:assert"

// files:
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { MPL_TOKEN_METADATA_PROGRAM_ID, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { setupInitialize } from "../test-utils/setupInitialize";
import { logTransactionURL } from "../test-utils/log";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

import { Program } from "@coral-xyz/anchor";
import { Blockbuster } from "../target/types/blockbuster";
import { setupNFT } from "../test-utils/setupNFT";
import { MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";
import { COLLECTION_MINT_SEED, CONF_SEED, MINT_SEED } from "../test-utils/const";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";

anchor.setProvider(anchor.AnchorProvider.env());
const program = anchor.workspace.Blockbuster as Program<Blockbuster>;
const provider = anchor.getProvider();
const connection = new anchor.web3.Connection(provider.connection.rpcEndpoint, "finalized");

// const { config, mint, vault, collectionMint, collectionMintATA } = setupInitialize()

// const { program, provider, wallet: admin } = setup();


describe("Initialize", () => {
  const admin = provider.wallet as NodeWallet;

  const config = PublicKey.findProgramAddressSync(
    [Buffer.from(CONF_SEED), admin.payer.publicKey.toBuffer()], program.programId)[0];

  const mint = PublicKey.findProgramAddressSync(
    [Buffer.from(MINT_SEED), config.toBuffer()], program.programId)[0];

  const vault = getAssociatedTokenAddressSync(mint, config, true);

  const collectionMint = PublicKey.findProgramAddressSync(
    [Buffer.from(COLLECTION_MINT_SEED), config.toBuffer()], program.programId)[0];

  const collectionMintATA = getAssociatedTokenAddressSync(collectionMint, config, true);

  const masterEdition = PublicKey.findProgramAddressSync(
    [Buffer.from(CONF_SEED), admin.payer.publicKey.toBuffer()], SystemProgram.programId)[0]

  const metadata = PublicKey.findProgramAddressSync(
    [Buffer.from(CONF_SEED), admin.payer.publicKey.toBuffer()], SystemProgram.programId)[0];

  const collection = metadata;

  console.log({ metadata, masterEdition })

  before(async () => {
    const umi = createUmi(connection);
    umi.use(keypairIdentity(fromWeb3JsKeypair(admin.payer)));
    umi.use(mplTokenMetadata());
    console.log(`created NFT Collection with UMI: ${collectionMint.toString()}`)
  })

  it("Shall be able to initialize protocol", async () => {
    console.log('init accounts:', { config, mint, vault });
    try {

      // Action:
      const initAccounts = {
        admin: admin.payer.publicKey,
        config,
        mint,
        vault,
        collectionMint,
        collectionMintATA,
        metadata,
        masterEdition,
        collection,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        metadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
      };

      console.log('calling init', { config });
      const tx = await program
        .methods
        .initialize()
        .accountsPartial({ ...initAccounts })
        .rpc();

      const configAccount = await program.account.config.fetch(config);
      console.log(configAccount.mint);
      assert.equal(configAccount.locked, false);

      logTransactionURL(tx)
    } catch (e) {
      if (e instanceof SendTransactionError) {
        console.log(e.logs);
      } else {
        console.log('is not send transaction error')
        console.error(e);
      }
    }
  });
  // })
  // describe("Lock/Unlock:", () => {

  it("Admin shall be able to lock protocol", async () => {
    try {
      let { admin, program, config, mint, vault } = setupInitialize();
      const confAccount = await program.account.config.fetch(config);

      const tx = await program.methods
        .lock()
        .accountsPartial({ admin: admin.publicKey, config, mint, vault })
        .signers([admin.payer])
        .rpc();

      logTransactionURL(tx);

      const configAccount = await program.account.config.fetch(config);
      console.log({ configAccount });
      console.log("admin locks protocol");
      assert.equal(configAccount.locked, true);
    } catch (e) {
      console.error(e)
    }
  });

  it("Non-Admin shall not be able to lock protocol", async () => {
    const nonAdmin = Keypair.generate();
    try {
      let { config, program, provider, admin } = setupInitialize();

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
    let { config, program, provider, admin } = setupInitialize();
    try {
      await program.methods
        .lock()
        .accountsPartial({ admin: admin.publicKey, config })
        .rpc();

      const configAccount = await program.account.config.fetch(config);
      assert.equal(configAccount.locked, false);
    } catch (e) { console.error(e) }
  });

  it("Non-admin: shall not be able to unlock protocol", async () => {
    const nonAdmin = Keypair.generate();
    let { config, program } = setupInitialize();

    try {

      await program.methods
        .lock()
        .accountsPartial({ admin: nonAdmin.publicKey, config })
        .rpc();

      const configAccount = await program.account.config.fetch(config);
      console.log(configAccount);
      assert.equal(configAccount.locked, false);

      assert.fail("this instruction shall fail")
    } catch (e) {
      assert.match(e.message, /Signature verification failed./);
    }
  });
})


describe("Actor: Citizen", () => {
  //
  //   it("Citizen shall be able to report new case address", async () => {
  //     const { accounts, user, suspect } = await setupCitizen();
  //
  //     const tx = await program
  //       .methods
  //       .report(suspect)
  //       .accounts(accounts)
  //       .signers([user])
  //       .rpc();
  //     logTransactionURL(tx);
  //
  //     // const record = await program.account.case.fetch(accounts.record);
  //
  //     // assert.equal(record.count, 1);
  //     // console.log({ record });
  //     const tx2 = await program
  //       .methods
  //       .report(suspect)
  //       .accounts(accounts)
  //       .signers([user])
  //       .rpc();
  //
  //     const record2 = await program.account.case.fetch(accounts.record);
  //     assert.equal(record2.count, 2);
  //     logTransactionURL(tx2);
  //   });
  //
  //   it("Citizen shall increase counter & get notified when reporting existing address", async () => {
  //     const { accounts, user, suspect } = await setupCitizen();
  //
  //     const reportSuspect1 = await program.methods
  //       .report(suspect)
  //       .accountsPartial(accounts)
  //       .signers([user])
  //       .rpc();
  //     const counter = program.account.case.fetch(accounts.record);
  //
  //     logTransactionURL(reportSuspect1);
  //   });
  //
  //   it("Citizen shall not be able to report own address", async () => {
  //     const { accounts, user, suspect } = await setupCitizen();
  //     accounts.record = PublicKey.findProgramAddressSync(
  //       [Buffer.from(SUSPECT_SEED), user.publicKey.toBuffer()], program.programId)[0];
  //
  //     const reportSelf = await program.methods
  //       .report(user.publicKey)
  //       .accountsPartial(accounts)
  //       .signers([user])
  //       .rpc();
  //
  //     logTransactionURL(reportSelf);
  //   });
  //
  //   it.skip("Citizen shall not be able to report address in busted list", async () => {
  //     // const { accounts,user, suspect} = await setupCitizen();
  //     // const detective = Keypair.generate();
  //     // ctx.setRecord(suspect);
  //
  //     // const userReportsAddress= await program.methods
  //     //   .report(suspect)
  //     //   .accountsPartial({ ...ctx.getAccounts() })
  //     //   .signers([ctx.user])
  //     //   .rpc();
  //     // logTransactionURL(userReportsAddress);
  //
  //     // // TODO: add instruction for Detective to move address into busted list
  //     // const detectiveBustsAddress = await program.methods
  //     //   .report(suspect)
  //     //   .accountsPartial({ ...ctx.getAccounts() })
  //     //   .signers([detective])
  //     //   .rpc();
  //     // logTransactionURL(detectiveBustsAddress);
  //
  //     // const userReportsAddressAgain = await program.methods
  //     //   .report(ctx.user.publicKey)
  //     //   .accountsPartial({ ...ctx.getAccounts() })
  //     //   .signers([ctx.user])
  //     //   .rpc();
  //     // logTransactionURL(userReportsAddressAgain);
  //
  //   });
  //
  //   it("Citizen shall not be able to report address in allow-list", () => {
  //     // detective: add pubkey
  //     // detective: allowlist the pubkey
  //     // citizen: try to report the pubkey
  //     // assert: failed
  //     throw new Error("Not Implemented");
  //   });
  //   it("Citizen shall not be able to report anything if citizen is suspect", () => {
  //     throw new Error("Not Implemented");
  //   });
  //   it("Citizen shall not be able to report anything if citizen is busted", () => {
  //     throw new Error("Not Implemented");
  //   });
});
