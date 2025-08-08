import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Blockbuster } from "../target/types/blockbuster";
import { PublicKey, SystemProgram } from "@solana/web3.js";
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

describe("init", () => {
  it("Is initialized!", async () => {
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
});
