import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey, SendTransactionError, SystemProgram, } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";

// native nodejs
import assert from "node:assert"

// files:
import { publicKey } from "@metaplex-foundation/umi";
import { findMasterEditionPda, findMetadataPda, MPL_TOKEN_METADATA_PROGRAM_ID, verifySizedCollectionItem } from "@metaplex-foundation/mpl-token-metadata";
import { setupInitialize } from "../test-utils/setupInitialize";
import { logTransactionURL } from "../test-utils/log";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

import { Program } from "@coral-xyz/anchor";
import { Blockbuster } from "../target/types/blockbuster";
import { setupNFT } from "../test-utils/setupNFT";
import { MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";

anchor.setProvider(anchor.AnchorProvider.env());
const program = anchor.workspace.Blockbuster as Program<Blockbuster>;
const provider = anchor.getProvider();
const admin = provider.wallet as NodeWallet;
const connection = new anchor.web3.Connection(provider.connection.rpcEndpoint, "finalized");

const { config, mint, vault, collectionMint, collectionMintATA } = setupInitialize()
describe("Initialize", () => {
  let metadata;
  let masterEdition;
  let collection: PublicKey;

  before(async () => { 
    const { umi } = await setupNFT(provider, connection);

    metadata = findMetadataPda(umi, { mint: publicKey(collectionMint) })[0];
    masterEdition = findMasterEditionPda(umi, { mint: publicKey(collectionMint) })[0];
    collection = metadata;

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
      let { admin, program, config, mint, vault } = await setupInitialize();
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
      let { config, program, provider, admin } = await setupInitialize();

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
    let { config, program } = await setupInitialize();

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
