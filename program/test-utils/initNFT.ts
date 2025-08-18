import * as anchor from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { createNft, findMasterEditionPda, findMetadataPda, mplTokenMetadata, verifySizedCollectionItem } from "@metaplex-foundation/mpl-token-metadata";
import { createSignerFromKeypair, generateSigner, keypairIdentity, KeypairSigner, percentAmount, publicKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { airDrop } from "./airdrop";
import { toWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

export async function initNFT(provider: anchor.Provider) {
  // const { collectionMint, umi, nftMint, creator, creatorWallet } = umiSetup(provider);

  const wal = provider.wallet as NodeWallet;
  const umi = createUmi(provider.connection.rpcEndpoint);

  const nftMint: KeypairSigner = generateSigner(umi);
  const collectionMint: KeypairSigner = generateSigner(umi);

  const creatorWallet = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wal.payer.secretKey));
  const creator = createSignerFromKeypair(umi, creatorWallet);

  umi.use(keypairIdentity(creator))
  umi.use(mplTokenMetadata());

  await airDrop(provider, toWeb3JsPublicKey(collectionMint.publicKey), 2);
  await airDrop(provider, provider.wallet.publicKey, 2);
  await airDrop(provider, toWeb3JsPublicKey(creatorWallet.publicKey), 2);
  await airDrop(provider, toWeb3JsPublicKey(nftMint.publicKey), 2);
  // await airDrop(provider, provider.wallet.publicKey, 2);
  await createNft(umi, {
    mint: collectionMint,
    name: "test",
    symbol: "test",
    uri: "https://test.com",
    sellerFeeBasisPoints: percentAmount(1),
    collectionDetails: { __kind: "V1", size: 10 },
  }).sendAndConfirm(umi);
  console.log(`created NFT Collection with UMI: ${collectionMint.publicKey.toString()}`)

  // mint NFT to maker ATA:
  await createNft(umi, {
    mint: nftMint,
    name: "test1",
    symbol: "test1",
    uri: "https://test.com",
    sellerFeeBasisPoints: percentAmount(1),
    collection: {
      verified: false,
      key: collectionMint.publicKey
    },
    tokenOwner: publicKey(provider.wallet.payer.publicKey),
  }).sendAndConfirm(umi, { send: { commitment: "finalized" } });
  console.log(`NFT created with UMI: ${nftMint.publicKey.toString()}`);

  // verify collection
  const collectionMeta = findMetadataPda(umi, { mint: collectionMint.publicKey });
  const collectionMasterEdition = findMasterEditionPda(umi, { mint: collectionMint.publicKey });
  const nftMeta = findMetadataPda(umi, { mint: nftMint.publicKey });

  await verifySizedCollectionItem(umi, {
    metadata: nftMeta,
    collectionAuthority: creator,
    collectionMint: collectionMint.publicKey,
    collection: collectionMeta,
    collectionMasterEditionAccount: collectionMasterEdition
  }).sendAndConfirm(umi, { send: { commitment: "finalized" } });
  console.log("NFT Verified");


  const collectionMintAta = (await getOrCreateAssociatedTokenAccount(
    provider.connection,
    provider.wallet.payer,
    new anchor.web3.PublicKey(nftMint.publicKey),
    provider.wallet.payer.publicKey
  ))

  return {
    collectionMint,
    collectionMintAta,
    collectionMasterEdition,
    collectionMeta,
  }
}

