import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";

describe("AgentMemory Protocol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Agentmemory as Program;
  const authority = provider.wallet;

  const treasury = Keypair.generate();
  const creator = Keypair.generate();
  const buyer = Keypair.generate();

  const agentId = "test-agent-001";
  const moduleId = "bitemporal-v1";
  let agentPda: PublicKey;
  let memoryLogPubkey: PublicKey;

  before(async () => {
    [agentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), Buffer.from(agentId)],
      program.programId
    );

    const airdropCreator = await provider.connection.requestAirdrop(
      creator.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropCreator);

    const airdropBuyer = await provider.connection.requestAirdrop(
      buyer.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropBuyer);

    const airdropTreasury = await provider.connection.requestAirdrop(
      treasury.publicKey,
      0.1 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTreasury);
  });

  it("Initializes platform config", async () => {
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform_config")],
      program.programId
    );

    await program.methods
      .initializePlatform(treasury.publicKey, 500, 500)
      .accounts({
        platformConfig: configPda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const config = await program.account.platformConfig.fetch(configPda);
    assert.equal(config.platformFeeBps, 500);
    assert.equal(config.referralFeeBps, 500);
    assert.equal(
      (config.treasury as PublicKey).toBase58(),
      treasury.publicKey.toBase58()
    );
    assert.equal(
      (config.authority as PublicKey).toBase58(),
      authority.publicKey.toBase58()
    );
  });

  it("Initializes an agent", async () => {
    await program.methods
      .initializeAgent(agentId)
      .accounts({
        agent: agentPda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const agent = await program.account.agentAccount.fetch(agentPda);
    assert.equal(agent.agentId, agentId);
    assert.equal((agent.reputation as BN).toNumber(), 0);
    assert.equal((agent.totalLogs as BN).toNumber(), 0);
    assert.equal((agent.totalAttestations as BN).toNumber(), 0);
  });

  it("Logs a decision", async () => {
    const inputData = "BTC at $97000, RSI oversold at 28";
    const logicData = "Apply DCA strategy, buy 0.01 BTC";

    const slot = await provider.connection.getSlot();
    const blockTime = await provider.connection.getBlockTime(slot);

    const buf = Buffer.alloc(8);
    buf.writeBigInt64LE(BigInt(blockTime!));
    const [memLogPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("memory"), agentPda.toBuffer(), buf],
      program.programId
    );

    const tx = await program.methods
      .logDecision(inputData, logicData)
      .accounts({
        agent: agentPda,
        memoryLog: memLogPda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Decision logged:", tx);

    const memLog = await program.account.memoryLog.fetch(memLogPda);
    assert.equal((memLog.agent as PublicKey).toBase58(), agentPda.toBase58());
    assert.isFalse(memLog.isAttested as boolean);
    assert.isNotNull(memLog.inputHash);
    assert.isNotNull(memLog.logicHash);
    assert.isNotNull(memLog.merkleRoot);

    memoryLogPubkey = memLogPda;

    const agent = await program.account.agentAccount.fetch(agentPda);
    assert.equal((agent.totalLogs as BN).toNumber(), 1);
  });

  it("Attests an outcome", async () => {
    const outcomeData = "Bought at $97050, profit +2.3% after 4h";
    const success = true;
    const scoreDelta = 10;

    const [attestPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("attest"), memoryLogPubkey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .attestOutcome(outcomeData, success, new BN(scoreDelta))
      .accounts({
        agent: agentPda,
        memoryLog: memoryLogPubkey,
        attestation: attestPda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Outcome attested:", tx);

    const attestation = await program.account.attestation.fetch(attestPda);
    assert.isTrue(attestation.success as boolean);
    assert.equal((attestation.scoreDelta as BN).toNumber(), scoreDelta);

    const memLog = await program.account.memoryLog.fetch(memoryLogPubkey);
    assert.isTrue(memLog.isAttested as boolean);

    const agent = await program.account.agentAccount.fetch(agentPda);
    assert.equal((agent.reputation as BN).toNumber(), 10);
    assert.equal((agent.totalAttestations as BN).toNumber(), 1);
  });

  it("Prevents double attestation", async () => {
    const [attestPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("attest"), memoryLogPubkey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .attestOutcome("duplicate", true, new BN(5))
        .accounts({
          agent: agentPda,
          memoryLog: memoryLogPubkey,
          attestation: attestPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      assert.fail("Should have thrown");
    } catch (err: any) {
      assert.ok(err.toString().includes("already in use") || err.toString().includes("AlreadyAttested"));
    }
  });

  it("Registers a memory module", async () => {
    const priceLamports = 100_000_000; // 0.1 SOL
    const royaltyBps = 9000; // 90%
    const ipfsHash = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";

    const [modulePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("module"), Buffer.from(moduleId)],
      program.programId
    );

    const tx = await program.methods
      .registerModule(moduleId, new BN(priceLamports), royaltyBps, ipfsHash)
      .accounts({
        moduleMetadata: modulePda,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    console.log("Module registered:", tx);

    const mod = await program.account.moduleMetadata.fetch(modulePda);
    assert.equal(mod.moduleId, moduleId);
    assert.equal((mod.priceLamports as BN).toNumber(), priceLamports);
    assert.equal(mod.royaltyBps, royaltyBps);
    assert.equal(mod.ipfsHash, ipfsHash);
    assert.isTrue(mod.isActive as boolean);
    assert.equal((mod.totalSales as BN).toNumber(), 0);
  });

  it("Purchases a module with royalty distribution", async () => {
    const [modulePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("module"), Buffer.from(moduleId)],
      program.programId
    );
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform_config")],
      program.programId
    );

    const buyerAgentId = "buyer-agent-001";
    const [buyerAgentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), Buffer.from(buyerAgentId)],
      program.programId
    );

    await program.methods
      .initializeAgent(buyerAgentId)
      .accounts({
        agent: buyerAgentPda,
        authority: buyer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();

    const [purchasePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("purchase"), buyerAgentPda.toBuffer(), modulePda.toBuffer()],
      program.programId
    );

    const creatorBalBefore = await provider.connection.getBalance(
      creator.publicKey
    );
    const treasuryBalBefore = await provider.connection.getBalance(
      treasury.publicKey
    );

    const tx = await program.methods
      .purchaseModule(null)
      .accounts({
        moduleMetadata: modulePda,
        platformConfig: configPda,
        modulePurchase: purchasePda,
        agent: buyerAgentPda,
        buyer: buyer.publicKey,
        treasury: treasury.publicKey,
        creatorWallet: creator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();

    console.log("Module purchased:", tx);

    const purchase = await program.account.modulePurchase.fetch(purchasePda);
    assert.equal(
      (purchase.agent as PublicKey).toBase58(),
      buyerAgentPda.toBase58()
    );
    assert.equal(
      (purchase.module as PublicKey).toBase58(),
      modulePda.toBase58()
    );
    assert.equal((purchase.pricePaid as BN).toNumber(), 100_000_000);

    const mod = await program.account.moduleMetadata.fetch(modulePda);
    assert.equal((mod.totalSales as BN).toNumber(), 1);
    assert.equal((mod.totalRevenue as BN).toNumber(), 100_000_000);

    const creatorBalAfter = await provider.connection.getBalance(
      creator.publicKey
    );
    const treasuryBalAfter = await provider.connection.getBalance(
      treasury.publicKey
    );

    // Platform fee: 100M * 500/10000 = 5M lamports
    const platformFee = 5_000_000;
    // Creator gets rest: 100M - 5M = 95M (no referrer)
    const creatorRoyalty = 95_000_000;

    assert.approximately(
      treasuryBalAfter - treasuryBalBefore,
      platformFee,
      1000
    );
    assert.approximately(
      creatorBalAfter - creatorBalBefore,
      creatorRoyalty,
      1000
    );
  });

  it("Prevents duplicate purchase", async () => {
    const [modulePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("module"), Buffer.from(moduleId)],
      program.programId
    );
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform_config")],
      program.programId
    );

    const buyerAgentId = "buyer-agent-001";
    const [buyerAgentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), Buffer.from(buyerAgentId)],
      program.programId
    );
    const [purchasePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("purchase"), buyerAgentPda.toBuffer(), modulePda.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .purchaseModule(null)
        .accounts({
          moduleMetadata: modulePda,
          platformConfig: configPda,
          modulePurchase: purchasePda,
          agent: buyerAgentPda,
          buyer: buyer.publicKey,
          treasury: treasury.publicKey,
          creatorWallet: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();
      assert.fail("Should have thrown for duplicate purchase");
    } catch (err: any) {
      assert.ok(err.toString().includes("already in use"));
    }
  });

  it("Rejects module with price too low", async () => {
    const badModuleId = "bad-module";
    const [badModulePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("module"), Buffer.from(badModuleId)],
      program.programId
    );

    try {
      await program.methods
        .registerModule(badModuleId, new BN(100), 9000, "QmTest123")
        .accounts({
          moduleMetadata: badModulePda,
          creator: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();
      assert.fail("Should have thrown for price too low");
    } catch (err: any) {
      assert.ok(err.toString().includes("PriceTooLow"));
    }
  });
});
