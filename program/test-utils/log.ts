import * as anchor from "@coral-xyz/anchor"
const provider = anchor.getProvider();

/**
 * @description print link to inspect on solana explorer
 * */
export const logTransactionURL = async (signature: string): Promise<void> => {
  console.log(
    "Your transaction signature:\n"
    + "https://explorer.solana.com/transaction/"
    + signature
    + "?cluster=custom&customUrl="
    + provider.connection.rpcEndpoint
    + "\n"
  );
};
