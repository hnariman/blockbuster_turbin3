import * as anchor from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { createSignerFromKeypair, generateSigner, keypairIdentity, KeypairSigner } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

export function umiSetup(provider: anchor.Provider) {
  const wal = provider.wallet as NodeWallet;
  const umi = createUmi(provider.connection.rpcEndpoint);
  const nftMint: KeypairSigner = generateSigner(umi);
  const collectionMint: KeypairSigner = generateSigner(umi);
  const creatorWallet = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wal.payer.secretKey));
  const creator = createSignerFromKeypair(umi, creatorWallet);
  umi.use(keypairIdentity(creator)).use(mplTokenMetadata());

  return {
    umi,
    nftMint,
    collectionMint,
    creatorWallet,
    creator,
    provider,
  }
}
