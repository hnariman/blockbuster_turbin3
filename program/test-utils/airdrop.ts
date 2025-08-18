import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { LAMPORTS_PER_SOL } from "./const";

export async function airDrop(provider: anchor.Provider, user: PublicKey, amount: Number) {

  const { blockhash, lastValidBlockHeight } = await provider.connection.getLatestBlockhash();

  const signature = await provider.connection.requestAirdrop(user, (LAMPORTS_PER_SOL * +amount));

  await provider.connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature }, "confirmed");

  const balanceSOL = (await provider.connection.getAccountInfo(user)).lamports / LAMPORTS_PER_SOL;
  console.log({ balance: balanceSOL });

  // assert.equal(balanceSOL, amount);
}



