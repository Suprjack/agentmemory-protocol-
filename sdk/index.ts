import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair, SystemProgram } from "@solana/web3.js";

export interface AgentAccount {
  agentId: string;
  authority: PublicKey;
  reputation: number;
  totalLogs: number;
  totalAttestations: number;
  bump: number;
}

export interface MemoryLogAccount {
  agent: PublicKey;
  inputHash: number[];
  logicHash: number[];
  merkleRoot: number[];
  timestamp: number;
  isAttested: boolean;
  bump: number;
}

export interface AttestationAccount {
  memoryLog: PublicKey;
  outcomeHash: number[];
  success: boolean;
  scoreDelta: number;
  timestamp: number;
  bump: number;
}

export interface ModuleMetadataAccount {
  moduleId: string;
  creator: PublicKey;
  priceLamports: number;
  royaltyBps: number;
  totalSales: number;
  totalRevenue: number;
  ipfsHash: string;
  isActive: boolean;
  bump: number;
}

export interface ModulePurchaseAccount {
  agent: PublicKey;
  module: PublicKey;
  purchasedAt: number;
  pricePaid: number;
  bump: number;
}

export interface PlatformConfigAccount {
  authority: PublicKey;
  treasury: PublicKey;
  platformFeeBps: number;
  referralFeeBps: number;
  bump: number;
}

export class AgentMemoryClient {
  program: Program;
  provider: AnchorProvider;

  constructor(
    connection: Connection,
    wallet: Wallet,
    programId: PublicKey,
    idl?: any
  ) {
    this.provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    if (idl) {
      this.program = new Program(idl, programId, this.provider);
    } else {
      this.program = new Program(
        require("../target/idl/agentmemory.json"),
        programId,
        this.provider
      );
    }
  }

  // ============================================================================
  // PDA Derivations
  // ============================================================================

  getPlatformConfigPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("platform_config")],
      this.program.programId
    );
  }

  getAgentPDA(agentId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), Buffer.from(agentId)],
      this.program.programId
    );
  }

  getMemoryLogPDA(agentPubkey: PublicKey, timestamp: number): [PublicKey, number] {
    const buf = Buffer.alloc(8);
    buf.writeBigInt64LE(BigInt(timestamp));
    return PublicKey.findProgramAddressSync(
      [Buffer.from("memory"), agentPubkey.toBuffer(), buf],
      this.program.programId
    );
  }

  getAttestationPDA(memoryLogPubkey: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("attest"), memoryLogPubkey.toBuffer()],
      this.program.programId
    );
  }

  getModulePDA(moduleId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("module"), Buffer.from(moduleId)],
      this.program.programId
    );
  }

  getPurchasePDA(agentPubkey: PublicKey, modulePubkey: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("purchase"), agentPubkey.toBuffer(), modulePubkey.toBuffer()],
      this.program.programId
    );
  }

  // ============================================================================
  // Core Instructions: Agent + Memory
  // ============================================================================

  async initializeAgent(agentId: string): Promise<string> {
    const [agentPda] = this.getAgentPDA(agentId);

    const tx = await this.program.methods
      .initializeAgent(agentId)
      .accounts({
        agent: agentPda,
        authority: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  async logDecision(
    agentId: string,
    inputData: string,
    logicData: string
  ): Promise<{ tx: string; memoryLogPubkey: PublicKey; timestamp: number }> {
    const [agentPda] = this.getAgentPDA(agentId);

    const clock = await this.provider.connection.getSlot();
    const blockTime = await this.provider.connection.getBlockTime(clock);
    if (!blockTime) throw new Error("Could not get block time");

    const [memoryLogPda] = this.getMemoryLogPDA(agentPda, blockTime);

    const tx = await this.program.methods
      .logDecision(inputData, logicData)
      .accounts({
        agent: agentPda,
        memoryLog: memoryLogPda,
        authority: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return { tx, memoryLogPubkey: memoryLogPda, timestamp: blockTime };
  }

  async attestOutcome(
    agentId: string,
    memoryLogPubkey: PublicKey,
    outcomeData: string,
    success: boolean,
    scoreDelta: number
  ): Promise<string> {
    const [agentPda] = this.getAgentPDA(agentId);
    const [attestationPda] = this.getAttestationPDA(memoryLogPubkey);

    const tx = await this.program.methods
      .attestOutcome(outcomeData, success, new BN(scoreDelta))
      .accounts({
        agent: agentPda,
        memoryLog: memoryLogPubkey,
        attestation: attestationPda,
        authority: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  // ============================================================================
  // Marketplace Instructions: Platform + Modules + Purchases
  // ============================================================================

  async initializePlatform(
    treasury: PublicKey,
    platformFeeBps: number,
    referralFeeBps: number
  ): Promise<string> {
    const [configPda] = this.getPlatformConfigPDA();

    const tx = await this.program.methods
      .initializePlatform(treasury, platformFeeBps, referralFeeBps)
      .accounts({
        platformConfig: configPda,
        authority: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  async registerModule(
    moduleId: string,
    priceLamports: number,
    royaltyBps: number,
    ipfsHash: string
  ): Promise<string> {
    const [modulePda] = this.getModulePDA(moduleId);

    const tx = await this.program.methods
      .registerModule(moduleId, new BN(priceLamports), royaltyBps, ipfsHash)
      .accounts({
        moduleMetadata: modulePda,
        creator: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  async purchaseModule(
    moduleId: string,
    agentId: string,
    referrer?: PublicKey
  ): Promise<string> {
    const [modulePda] = this.getModulePDA(moduleId);
    const [agentPda] = this.getAgentPDA(agentId);
    const [purchasePda] = this.getPurchasePDA(agentPda, modulePda);
    const [configPda] = this.getPlatformConfigPDA();

    const moduleAccount = await this.getModule(moduleId);
    const config = await this.getPlatformConfig();

    const accounts: any = {
      moduleMetadata: modulePda,
      platformConfig: configPda,
      modulePurchase: purchasePda,
      agent: agentPda,
      buyer: this.provider.wallet.publicKey,
      treasury: config.treasury,
      creatorWallet: moduleAccount.creator,
      systemProgram: SystemProgram.programId,
    };

    if (referrer) {
      accounts.referrerWallet = referrer;
    }

    const tx = await this.program.methods
      .purchaseModule(referrer || null)
      .accounts(accounts)
      .rpc();

    return tx;
  }

  // ============================================================================
  // Read Operations
  // ============================================================================

  async getAgent(agentId: string): Promise<AgentAccount> {
    const [agentPda] = this.getAgentPDA(agentId);
    const account = await this.program.account.agentAccount.fetch(agentPda);

    return {
      agentId: account.agentId as string,
      authority: account.authority as PublicKey,
      reputation: (account.reputation as BN).toNumber(),
      totalLogs: (account.totalLogs as BN).toNumber(),
      totalAttestations: (account.totalAttestations as BN).toNumber(),
      bump: account.bump as number,
    };
  }

  async getMemoryLog(memoryLogPubkey: PublicKey): Promise<MemoryLogAccount> {
    const account = await this.program.account.memoryLog.fetch(memoryLogPubkey);

    return {
      agent: account.agent as PublicKey,
      inputHash: account.inputHash as number[],
      logicHash: account.logicHash as number[],
      merkleRoot: account.merkleRoot as number[],
      timestamp: (account.timestamp as BN).toNumber(),
      isAttested: account.isAttested as boolean,
      bump: account.bump as number,
    };
  }

  async getAttestation(memoryLogPubkey: PublicKey): Promise<AttestationAccount> {
    const [attestPda] = this.getAttestationPDA(memoryLogPubkey);
    const account = await this.program.account.attestation.fetch(attestPda);

    return {
      memoryLog: account.memoryLog as PublicKey,
      outcomeHash: account.outcomeHash as number[],
      success: account.success as boolean,
      scoreDelta: (account.scoreDelta as BN).toNumber(),
      timestamp: (account.timestamp as BN).toNumber(),
      bump: account.bump as number,
    };
  }

  async getModule(moduleId: string): Promise<ModuleMetadataAccount> {
    const [modulePda] = this.getModulePDA(moduleId);
    const account = await this.program.account.moduleMetadata.fetch(modulePda);

    return {
      moduleId: account.moduleId as string,
      creator: account.creator as PublicKey,
      priceLamports: (account.priceLamports as BN).toNumber(),
      royaltyBps: account.royaltyBps as number,
      totalSales: (account.totalSales as BN).toNumber(),
      totalRevenue: (account.totalRevenue as BN).toNumber(),
      ipfsHash: account.ipfsHash as string,
      isActive: account.isActive as boolean,
      bump: account.bump as number,
    };
  }

  async getPlatformConfig(): Promise<PlatformConfigAccount> {
    const [configPda] = this.getPlatformConfigPDA();
    const account = await this.program.account.platformConfig.fetch(configPda);

    return {
      authority: account.authority as PublicKey,
      treasury: account.treasury as PublicKey,
      platformFeeBps: account.platformFeeBps as number,
      referralFeeBps: account.referralFeeBps as number,
      bump: account.bump as number,
    };
  }

  async hasPurchased(agentId: string, moduleId: string): Promise<boolean> {
    try {
      const [agentPda] = this.getAgentPDA(agentId);
      const [modulePda] = this.getModulePDA(moduleId);
      const [purchasePda] = this.getPurchasePDA(agentPda, modulePda);
      await this.program.account.modulePurchase.fetch(purchasePda);
      return true;
    } catch {
      return false;
    }
  }

  async getPurchase(agentId: string, moduleId: string): Promise<ModulePurchaseAccount | null> {
    try {
      const [agentPda] = this.getAgentPDA(agentId);
      const [modulePda] = this.getModulePDA(moduleId);
      const [purchasePda] = this.getPurchasePDA(agentPda, modulePda);
      const account = await this.program.account.modulePurchase.fetch(purchasePda);

      return {
        agent: account.agent as PublicKey,
        module: account.module as PublicKey,
        purchasedAt: (account.purchasedAt as BN).toNumber(),
        pricePaid: (account.pricePaid as BN).toNumber(),
        bump: account.bump as number,
      };
    } catch {
      return null;
    }
  }

  async downloadModuleFromIPFS(ipfsHash: string): Promise<string> {
    const url = `https://ipfs.io/ipfs/${ipfsHash}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`IPFS fetch failed: ${response.statusText}`);
    }
    return await response.text();
  }
}
