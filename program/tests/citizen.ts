import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram, } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// native nodejs
import { it, describe, before } from "node:test";
import assert from "node:assert"

// files:
import { Blockbuster } from "../target/types/blockbuster";
import { setupCitizen, setupInitialize } from "./helpers";

let admin: PublicKey;
anchor.setProvider(anchor.AnchorProvider.env());
const program = anchor.workspace.Blockbuster as Program<Blockbuster>;
const provider = anchor.getProvider();

const wallet = provider.wallet as anchor.Wallet;

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

const config_seeds = [Buffer.from("blockbuster_config"), wallet.publicKey.toBuffer()];
const [config, _config_bump] = PublicKey.findProgramAddressSync(config_seeds, program.programId);

const mint_seeds = [Buffer.from("blockbuster_mint"), config.toBuffer()];
const [mint, _mint_bump] = PublicKey.findProgramAddressSync(mint_seeds, program.programId);

const vault = getAssociatedTokenAddressSync(mint, config, true);

describe("Initialize", () => {
  it("Shall be able to initialize protocol", async () => {
    // Action:
    const initAccounts = {
      admin,
      config,
      mint,
      vault,
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
  });

});

describe("Lock/Unlock:", () => {

  it("Admin shall be able to lock protocol", async () => {
    let { wallet, provider, program } = await setupInitialize();
    const admin = provider.wallet.publicKey;

    const config_seeds =
      [Buffer.from("blockbuster_config"), wallet.publicKey.toBuffer()];

    const [config, _config_bump] =
      PublicKey.findProgramAddressSync(config_seeds, program.programId);

    const tx = await program.methods
      .lock()
      .accountsPartial({ admin, config })
      .signers([wallet.payer])
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
    let { config, program, provider } = await setupInitialize();
    const admin = provider.wallet.publicKey;

    await program.methods
      .lock()
      .accountsPartial({ admin, config })
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


describe("Actor: Citizen", () => {

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
