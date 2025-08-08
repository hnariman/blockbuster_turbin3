import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Blockbuster } from "../target/types/blockbuster";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

function setup() {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Blockbuster as Program<Blockbuster>;
  const provider = anchor.getProvider();
  const wallet = provider.wallet as anchor.Wallet;
  const seed = new anchor.BN(1234);

  return {
    program, provider, wallet, seed
  }
}

async function setupInitialize() {
  const { program, provider, wallet, seed } = setup();

  const config_seeds = [Buffer.from("blockbuster_config"), wallet.publicKey.toBuffer()];
  const [config, _config_bump] = PublicKey.findProgramAddressSync(config_seeds, program.programId);

  const mint_seeds = [Buffer.from("mint"), config.toBuffer()];
  const [mint, _mint_bump] = PublicKey.findProgramAddressSync(mint_seeds, program.programId);

  const vault = getAssociatedTokenAddressSync(mint, config, true);

  return {
    wallet,
    seed,
    vault,
    config,
    anchor,
    program,
    mint,
    provider
  }
}

describe("Actor: Admin", () => {
  it("Shall be ablet to initialize protocol", async () => {
    const { program, wallet, vault, config, mint } = await setupInitialize();
    const admin = wallet.publicKey;

    const tx = await program.methods
      .initialize()
      .accountsPartial({
        admin,
        config,
        mint,
        vault,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .rpc();
    console.log("Your transaction signature", tx);
  });

  describe("Lock:", () => {
    it("Admin shall be able to lock protocol", () => {
      throw new Error("Not Implemented");
    });
    it("Non-Admin shall not be able to lock protocol", () => {
      throw new Error("Not Implemented");
    });
  })
  describe("Unlock", () => {
    it("Admin shall be able to unlock protocol", () => {
      throw new Error("Not Implemented");
    });
    it("Non-admin: shall not be able to unlock protocol", () => {
      throw new Error("Not Implemented");
    });
  })
});

describe("Actor: Citizen", () => {
  it("Citizen shall be able to report non existing address", () => {
    throw new Error("Not Implemented");
  })
  it("Citizen shall increase counter & get notified when reporting existing address", () => {
    throw new Error("Not Implemented");
  })

  it("Citizen shall not be able to report own address", () => {
    throw new Error("Not Implemented");
  })
  it("Citizen shall not be able to report address in busted list", () => {
    throw new Error("Not Implemented");
  })
  it("Citizen shall not be able to report address in allow-list", () => {
    throw new Error("Not Implemented");
  })
  it("Citizen shall not be able to report anything if citizen is suspect", () => {
    throw new Error("Not Implemented");
  })
  it("Citizen shall not be able to report anything if citizen is busted", () => {
    throw new Error("Not Implemented");
  })
})

describe("Actor: Detective", () => {
  it("Detective: shall fail to update status without NFT", () => {
    throw new Error("Not Implemented");
  })
  it("Detective: shall be able to update status with NFT", () => {
    throw new Error("Not Implemented");
  })
  it("Detective: shall fail to interact if detective is in suspect list", () => {
    throw new Error("Not Implemented");
  })
})
