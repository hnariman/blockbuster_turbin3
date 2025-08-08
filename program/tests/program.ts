import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Blockbuster } from "../target/types/blockbuster";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
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
  const [config, _config_bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("blockbuster_config"), wallet.publicKey.toBuffer(),], program.programId);

  const mintKeyPair = Keypair.generate();
  console.log({ mintKeyPair })

  const mint = await createMint(
    provider.connection, // connection
    provider.wallet.payer, // payer
    config, // mint authority
    null, // freeze auth
    6, // decimals
    null,
  );
  console.log({ mint });

  const vault = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    mintKeyPair,
    mint,
    config
  );
  // const [vault, _vault_bump] = PublicKey.findProgramAddressSync(
  //   [
  //     Buffer.from("blockbuster_config"), 
  //     wallet.publicKey.toBuffer()
  //   ], program.programId);

  console.log({ timestamp: Date.now(), vault, config, mint });

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
    const { provider, program, anchor, wallet, vault, config, mint } = await setupInitialize();
    const admin = wallet.publicKey;

    const tx = await program.methods
      .initialize()
      .accountsPartial({
        admin,
        config,
        mint,
        vault,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .rpc();

    const vault_info = await provider.connection.getAccountInfo(vault);

    console.log("Your transaction signature", tx);
    console.log({ vault_info });
  });
});
