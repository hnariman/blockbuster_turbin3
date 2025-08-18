// import { describe, it } from "node:test"
// import assert from "node:assert"
// import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
// import { setupInitialize } from "./helpers";

// describe("Lock/Unlock:", () => {

//   it("Admin shall be able to lock protocol", async () => {
//     let { wallet, provider, program } = await setupInitialize();
//     const admin = provider.wallet.publicKey;

//     const config_seeds =
//       [Buffer.from(CONF_SEED), wallet.publicKey.toBuffer()];

//     const [config, _config_bump] =
//       PublicKey.findProgramAddressSync(config_seeds, program.programId);

//     const tx = await program.methods
//       .lock()
//       .accountsPartial({ admin, config })
//       .signers([wallet.payer])
//       .rpc();

//     console.log("Your transaction signature", tx);
//     const configAccount = await program.account.config.fetch(config);
//     console.log({ configAccount });
//     // assert.equal(configAccount.locked, true);
//   });

//   it("Non-Admin shall not be able to lock protocol", async () => {
//     const nonAdmin = Keypair.generate();
//     let { config, program } = await setupInitialize();
//     try {

//       await program.methods
//         .lock()
//         .accountsPartial({ admin: nonAdmin.publicKey, config })
//         .rpc();

//       const configAccount = await program.account.config.fetch(config);
//       assert.equal(configAccount.locked, true);
//       assert.fail("this instruction shall fail")
//     } catch (e) {
//       assert.match(e.message, /Signature verification failed./);
//     }
//   });

//   it("Admin shall be able to unlock protocol", async () => {
//     let { config, program, provider } = await setupInitialize();
//     const admin = provider.wallet.publicKey;

//     await program.methods
//       .unlock()
//       .accountsPartial({ admin, config })
//       .rpc();
//     const configAccount = await program.account.config.fetch(config);
//     assert.equal(configAccount.locked, false);
//   });

//   it("Non-admin: shall not be able to unlock protocol", async () => {
//     const nonAdmin = Keypair.generate();
//     let { config, program } = await setupInitialize();

//     try {

//       await program.methods
//         .unlock()
//         .accountsPartial({ admin: nonAdmin.publicKey, config })
//         .rpc();

//       assert.fail("this instruction shall fail")
//     } catch (e) {
//       assert.match(e.message, /Signature verification failed./);
//     }
//   });
// })
