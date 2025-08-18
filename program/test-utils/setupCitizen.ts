
export async function setupCitizen() {
  const { program, provider, wallet } = setup();
  const user = Keypair.generate();
  const suspect = Keypair.generate().publicKey;

  const configSeed = [Buffer.from(CONF_SEED), wallet.publicKey.toBuffer()];
  const config = PublicKey.findProgramAddressSync(configSeed, program.programId)[0];

  const mintSeeds = [Buffer.from(MINT_SEED), config.toBuffer()];
  const mint = PublicKey.findProgramAddressSync(mintSeeds, program.programId)[0];

  const recordSeed = [Buffer.from(SUSPECT_SEED), suspect.toBuffer()];
  const record = PublicKey.findProgramAddressSync(recordSeed, program.programId)[0];

  const vault = getAssociatedTokenAddressSync(mint, config, true);
  const userAta = getAssociatedTokenAddressSync(mint, user.publicKey, true);

  await airDrop(provider, user.publicKey, 12);

  const accounts: Partial<ReportAccounts> = {
    user: user.publicKey,
    config,
    mint,
    vault,
    record,
    userAta,
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
    suspect,
    record,
    vault,
    userAta,
    accounts,
    user
  }
}



