import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Blockbuster } from "./../target/types/blockbuster";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

/**
 * @description init anchor
 *
 * @returns program, provider, wallet, connection
  */
export function setup() {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Blockbuster as Program<Blockbuster>;
  const provider = anchor.getProvider();
  const wallet = provider.wallet as NodeWallet;
  const connection = new anchor.web3.Connection(provider.connection.rpcEndpoint, "finalized");
  return { program, provider, wallet, connection }
}

