// node std
import { describe, it, before } from "node:test"
import assert from "node:assert"
// libs
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Program, Wallet } from "@coral-xyz/anchor";
// project
import { Blockbuster } from "../target/types/blockbuster";
import { setupDetective, setupInitialize } from "./helpers";

describe("Actor: Detective", async () => {
  const { accounts, suspect, detective } = await setupDetective();

  it("Detective: shall fail to update status without NFT", () => {
    throw new Error("Not Implemented");
  })
  it("Detective: shall be able to update status with NFT", () => {
    throw new Error("Not Implemented");
  })
  it("Detective: shall fail to interact if detective is in suspect list", () => {
    throw new Error("Not Implemented");
  })
})
