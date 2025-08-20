import { Provider } from "@coral-xyz/anchor"
import { Connection, Keypair } from "@solana/web3.js";
// import { TSetupNFT } from "./types";
import { airDrop } from "./airdrop";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fromWeb3JsKeypair, toWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { Keypair as umiKeypair, KeypairSigner, Umi, keypairIdentity } from "@metaplex-foundation/umi";


export type TSetupNFT = {
  umi: Umi,
  // nftMint: KeypairSigner,
  // collectionMint: KeypairSigner,
  creator: umiKeypair,
}

/**
 * @description 
 * setting up umi, nftMint & collectionMint
 * 
 * @since provider has connection, but umi doesn't like it,
 * so we have to either create or pass new Connection()
 * took few days to figure out & debug, sending love to umi devs here :)
 * 
 * @returns {Promise<TSetupNFT>} umi instance + funded accounts for NFT
*/
export async function setupNFT(provider: Provider, connection: Connection): Promise<TSetupNFT> {

  // user will pay for mpl thingies
  const user = Keypair.generate();
  // await airDrop(provider, user.publicKey, 0.2);

  // and got to setup connection to mplx
  const umi = createUmi(connection);

  // nft & collection are mutable accounts as they do pay
  // const nftMint = generateSigner(umi);
  // const collectionMint = generateSigner(umi);

  // so they need some funds
  // await airDrop(provider, toWeb3JsPublicKey(nftMint.publicKey), 0.2);
  // await airDrop(provider, toWeb3JsPublicKey(collectionMint.publicKey), 0.2);

  // now I'm not sure if user & creator are same thing :)
  // but deadline & don't touch if it works says: "leve it alone"
  const creator = fromWeb3JsKeypair(provider.wallet.payer);
  await airDrop(provider, toWeb3JsPublicKey(creator.publicKey), 0.2);

  // traditional umi setup, plug identity (signer) and metadata
  // into umi middleware
  umi.use(keypairIdentity(fromWeb3JsKeypair(user)));
  umi.use(mplTokenMetadata());

  return {
    umi,
    // nftMint,
    // collectionMint,
    creator,
  }
}
