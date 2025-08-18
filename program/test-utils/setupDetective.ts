export async function setupDetective() {
  const { program, provider, wallet } = setup();
  const detective = Keypair.generate();
  const suspect = Keypair.generate().publicKey;

  const configSeed = [Buffer.from(CONF_SEED), wallet.publicKey.toBuffer()];
  const config = PublicKey.findProgramAddressSync(configSeed, program.programId)[0];

  const mintSeeds = [Buffer.from(MINT_SEED), config.toBuffer()];
  const mint = PublicKey.findProgramAddressSync(mintSeeds, program.programId)[0];

  const recordSeed = [Buffer.from(SUSPECT_SEED), suspect.toBuffer()];
  const record = PublicKey.findProgramAddressSync(recordSeed, program.programId)[0];

  const vault = getAssociatedTokenAddressSync(mint, config, true);
  const userAta = getAssociatedTokenAddressSync(mint, detective.publicKey, true);

  await airDrop(provider, detective.publicKey, 12);
  await airDrop(provider, provider.wallet.publicKey, 12);

  const accounts: Partial<ReportAccounts & { detective: PublicKey }> = {
    detective: detective.publicKey,
    config,
    mint,
    record,
    suspect,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
  }

  return {
    wallet,
    program,
    provider,
    config,
    mint,
    record,
    suspect,
    accounts,
    detective
  }
}


