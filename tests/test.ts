import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AgentMemory } from "../target/types/agent_memory";
import { assert } from "chai";

describe("AgentMemory Protocol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AgentMemory as Program<AgentMemory>;
  const authority = provider.wallet;

  let feeCollector: anchor.web3.Keypair;
  let creator: anchor.web3.Keypair;
  let buyer: anchor.web3.Keypair;

  before(async () => {
    feeCollector = anchor.web3.Keypair.generate();
    creator = anchor.web3.Keypair.generate();
    buyer = anchor.web3.Keypair.generate();

    // Airdrop SOL to test accounts
    await provider.connection.requestAirdrop(
      creator.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.requestAirdrop(
      buyer.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );

    // Wait for confirmations
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  it("Initializes platform config", async () => {
    const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    await program.methods
      .initialize(5, 10) // 5% platform fee, 10% royalty
      .accounts({
        platformConfig: configPda,
        authority: authority.publicKey,
        feeCollector: feeCollector.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const config = await program.account.platformConfig.fetch(configPda);
    assert.equal(config.platformFeePct, 5);
    assert.equal(config.royaltyPct, 10);
    assert.equal(config.authority.toBase58(), authority.publicKey.toBase58());
  });

  it("Registers a memory module", async () => {
    const moduleId = "bitemporal-v1";
    const [modulePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("module"), Buffer.from(moduleId)],
      program.programId
    );

    const tx = await program.methods
      .registerModule(
        moduleId,
        "Bi-Temporal Memory System",
        "Working memory + permanent archive with Ebbinghaus decay",
        anchor.web3.LAMPORTS_PER_SOL * 0.1, // 0.1 SOL
        "QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // IPFS hash
        { biTemporal: {} } // ModuleCategory::BiTemporal
      )
      .accounts({
        module: modulePda,
        creator: creator.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    console.log("Module registered:", tx);

    const module = await program.account.memoryModule.fetch(modulePda);
    assert.equal(module.moduleId, moduleId);
    assert.equal(module.name, "Bi-Temporal Memory System");
    assert.equal(module.price.toNumber(), anchor.web3.LAMPORTS_PER_SOL * 0.1);
    assert.equal(module.creator.toBase58(), creator.publicKey.toBase58());
    assert.equal(module.totalPurchases.toNumber(), 0);
  });

  it("Purchases a memory module", async () => {
    const moduleId = "bitemporal-v1";
    const [modulePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("module"), Buffer.from(moduleId)],
      program.programId
    );
    const [purchasePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("purchase"), buyer.publicKey.toBuffer(), Buffer.from(moduleId)],
      program.programId
    );
    const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    const creatorBalanceBefore = await provider.connection.getBalance(creator.publicKey);
    const buyerBalanceBefore = await provider.connection.getBalance(buyer.publicKey);

    const tx = await program.methods
      .purchaseModule()
      .accounts({
        module: modulePda,
        purchase: purchasePda,
        platformConfig: configPda,
        buyer: buyer.publicKey,
        creator: creator.publicKey,
        feeCollector: feeCollector.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();

    console.log("Module purchased:", tx);

    // Verify purchase record
    const purchase = await program.account.userPurchase.fetch(purchasePda);
    assert.equal(purchase.user.toBase58(), buyer.publicKey.toBase58());
    assert.equal(purchase.moduleId, moduleId);

    // Verify module stats updated
    const module = await program.account.memoryModule.fetch(modulePda);
    assert.equal(module.totalPurchases.toNumber(), 1);
    assert.equal(module.totalRevenue.toNumber(), anchor.web3.LAMPORTS_PER_SOL * 0.1);

    // Verify payments distributed correctly
    const creatorBalanceAfter = await provider.connection.getBalance(creator.publicKey);
    const buyerBalanceAfter = await provider.connection.getBalance(buyer.publicKey);
    const feeCollectorBalance = await provider.connection.getBalance(feeCollector.publicKey);

    const price = anchor.web3.LAMPORTS_PER_SOL * 0.1;
    const platformFee = (price * 5) / 100;
    const royalty = (price * 10) / 100;
    const creatorAmount = price - platformFee - royalty;

    assert.approximately(
      creatorBalanceAfter - creatorBalanceBefore,
      creatorAmount,
      1000 // Allow small variance for transaction fees
    );
    assert.approximately(feeCollectorBalance, platformFee, 1000);
  });

  it("Prevents duplicate purchases", async () => {
    const moduleId = "bitemporal-v1";
    const [modulePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("module"), Buffer.from(moduleId)],
      program.programId
    );
    const [purchasePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("purchase"), buyer.publicKey.toBuffer(), Buffer.from(moduleId)],
      program.programId
    );
    const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    try {
      await program.methods
        .purchaseModule()
        .accounts({
          module: modulePda,
          purchase: purchasePda,
          platformConfig: configPda,
          buyer: buyer.publicKey,
          creator: creator.publicKey,
          feeCollector: feeCollector.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      assert.fail("Should have thrown error for duplicate purchase");
    } catch (err) {
      // Expected: account already exists
      assert.include(err.toString(), "already in use");
    }
  });

  it("Rejects invalid IPFS hash", async () => {
    const moduleId = "invalid-module";
    const [modulePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("module"), Buffer.from(moduleId)],
      program.programId
    );

    try {
      await program.methods
        .registerModule(
          moduleId,
          "Invalid Module",
          "Test invalid IPFS hash",
          anchor.web3.LAMPORTS_PER_SOL * 0.1,
          "not-an-ipfs-hash", // Invalid format
          { custom: {} }
        )
        .accounts({
          module: modulePda,
          creator: creator.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      assert.fail("Should have thrown error for invalid IPFS hash");
    } catch (err) {
      assert.include(err.toString(), "InvalidIpfsHash");
    }
  });
});
