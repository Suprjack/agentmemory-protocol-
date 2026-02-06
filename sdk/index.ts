/**
 * AgentMemory Protocol SDK
 * 
 * TypeScript client for interacting with the AgentMemory Solana smart contract.
 * Enables AI agents to buy, sell, and manage memory modules on-chain.
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { AgentMemory } from "../target/types/agent_memory";
import idl from "../target/idl/agent_memory.json";

export enum ModuleCategory {
  BiTemporal = "BiTemporal",
  Procedural = "Procedural",
  Semantic = "Semantic",
  Episodic = "Episodic",
  Custom = "Custom",
}

export interface MemoryModule {
  moduleId: string;
  creator: PublicKey;
  name: string;
  description: string;
  price: number; // in lamports
  ipfsHash: string;
  category: ModuleCategory;
  createdAt: number;
  totalPurchases: number;
  totalRevenue: number;
}

export interface UserPurchase {
  user: PublicKey;
  moduleId: string;
  purchasedAt: number;
}

export class AgentMemoryClient {
  private program: Program<AgentMemory>;
  private provider: AnchorProvider;

  constructor(
    connection: Connection,
    wallet: Wallet,
    programId?: PublicKey
  ) {
    this.provider = new AnchorProvider(connection, wallet, {});
    const pid = programId || new PublicKey(idl.metadata.address);
    this.program = new Program(idl as any, pid, this.provider);
  }

  /**
   * Initialize the platform (admin only, run once)
   */
  async initialize(
    platformFeePct: number = 5,
    royaltyPct: number = 10,
    feeCollector: PublicKey
  ): Promise<string> {
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      this.program.programId
    );

    const tx = await this.program.methods
      .initialize(platformFeePct, royaltyPct)
      .accounts({
        platformConfig: configPda,
        authority: this.provider.wallet.publicKey,
        feeCollector,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  /**
   * Register a new memory module
   */
  async registerModule(
    moduleId: string,
    name: string,
    description: string,
    priceSOL: number,
    ipfsHash: string,
    category: ModuleCategory
  ): Promise<string> {
    const [modulePda] = this.getModulePDA(moduleId);
    const price = priceSOL * anchor.web3.LAMPORTS_PER_SOL;

    const categoryEnum = this.categoryToEnum(category);

    const tx = await this.program.methods
      .registerModule(
        moduleId,
        name,
        description,
        new anchor.BN(price),
        ipfsHash,
        categoryEnum
      )
      .accounts({
        module: modulePda,
        creator: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  /**
   * Purchase a memory module
   */
  async purchaseModule(moduleId: string): Promise<string> {
    const [modulePda] = this.getModulePDA(moduleId);
    const [purchasePda] = this.getPurchasePDA(
      this.provider.wallet.publicKey,
      moduleId
    );
    const [configPda] = this.getConfigPDA();

    // Fetch module to get creator address
    const module = await this.getModule(moduleId);
    const feeCollector = await this.getFeeCollector();

    const tx = await this.program.methods
      .purchaseModule()
      .accounts({
        module: modulePda,
        purchase: purchasePda,
        platformConfig: configPda,
        buyer: this.provider.wallet.publicKey,
        creator: module.creator,
        feeCollector,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  /**
   * Get module details
   */
  async getModule(moduleId: string): Promise<MemoryModule> {
    const [modulePda] = this.getModulePDA(moduleId);
    const account = await this.program.account.memoryModule.fetch(modulePda);

    return {
      moduleId: account.moduleId,
      creator: account.creator,
      name: account.name,
      description: account.description,
      price: account.price.toNumber(),
      ipfsHash: account.ipfsHash,
      category: this.enumToCategory(account.category),
      createdAt: account.createdAt.toNumber(),
      totalPurchases: account.totalPurchases.toNumber(),
      totalRevenue: account.totalRevenue.toNumber(),
    };
  }

  /**
   * Check if user owns a module
   */
  async hasPurchased(
    user: PublicKey,
    moduleId: string
  ): Promise<boolean> {
    try {
      const [purchasePda] = this.getPurchasePDA(user, moduleId);
      await this.program.account.userPurchase.fetch(purchasePda);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get user's purchase record
   */
  async getPurchase(
    user: PublicKey,
    moduleId: string
  ): Promise<UserPurchase | null> {
    try {
      const [purchasePda] = this.getPurchasePDA(user, moduleId);
      const account = await this.program.account.userPurchase.fetch(purchasePda);

      return {
        user: account.user,
        moduleId: account.moduleId,
        purchasedAt: account.purchasedAt.toNumber(),
      };
    } catch {
      return null;
    }
  }

  /**
   * Download module content from IPFS
   */
  async downloadModule(moduleId: string): Promise<string> {
    const module = await this.getModule(moduleId);
    const hasPurchased = await this.hasPurchased(
      this.provider.wallet.publicKey,
      moduleId
    );

    if (!hasPurchased) {
      throw new Error("You must purchase this module first");
    }

    // Fetch from IPFS gateway
    const ipfsUrl = `https://ipfs.io/ipfs/${module.ipfsHash}`;
    const response = await fetch(ipfsUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download from IPFS: ${response.statusText}`);
    }

    return await response.text();
  }

  // Helper methods

  private getModulePDA(moduleId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("module"), Buffer.from(moduleId)],
      this.program.programId
    );
  }

  private getPurchasePDA(
    user: PublicKey,
    moduleId: string
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("purchase"), user.toBuffer(), Buffer.from(moduleId)],
      this.program.programId
    );
  }

  private getConfigPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      this.program.programId
    );
  }

  private async getFeeCollector(): Promise<PublicKey> {
    const [configPda] = this.getConfigPDA();
    const config = await this.program.account.platformConfig.fetch(configPda);
    return config.feeCollector;
  }

  private categoryToEnum(category: ModuleCategory): any {
    const map = {
      [ModuleCategory.BiTemporal]: { biTemporal: {} },
      [ModuleCategory.Procedural]: { procedural: {} },
      [ModuleCategory.Semantic]: { semantic: {} },
      [ModuleCategory.Episodic]: { episodic: {} },
      [ModuleCategory.Custom]: { custom: {} },
    };
    return map[category];
  }

  private enumToCategory(enumVal: any): ModuleCategory {
    if (enumVal.biTemporal !== undefined) return ModuleCategory.BiTemporal;
    if (enumVal.procedural !== undefined) return ModuleCategory.Procedural;
    if (enumVal.semantic !== undefined) return ModuleCategory.Semantic;
    if (enumVal.episodic !== undefined) return ModuleCategory.Episodic;
    return ModuleCategory.Custom;
  }
}

// Example usage
export async function example() {
  const connection = new Connection("https://api.devnet.solana.com");
  const wallet = new Wallet(Keypair.generate()); // Use real wallet in production
  
  const client = new AgentMemoryClient(connection, wallet);

  // Register a module
  const tx1 = await client.registerModule(
    "bitemporal-v1",
    "Bi-Temporal Memory System",
    "Working memory + permanent archive with Ebbinghaus decay",
    0.1, // 0.1 SOL
    "QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    ModuleCategory.BiTemporal
  );
  console.log("Module registered:", tx1);

  // Purchase a module
  const tx2 = await client.purchaseModule("bitemporal-v1");
  console.log("Module purchased:", tx2);

  // Download module content
  const content = await client.downloadModule("bitemporal-v1");
  console.log("Module content:", content);
}
