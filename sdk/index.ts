import { AnchorProvider, Program, BN } from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import * as crypto from 'crypto';

export class TrustLayer {
  program: Program;
  provider: AnchorProvider;
  wallet: Keypair;

  constructor(program: Program, provider: AnchorProvider, wallet: Keypair) {
    this.program = program;
    this.provider = provider;
    this.wallet = wallet;
  }

  /**
   * Initialize TrustLayer SDK
   * @param connection Solana connection
   * @param wallet Keypair for signing transactions
   * @param programId Program ID (optional, defaults to mainnet)
   */
  static async init(
    connection: Connection,
    wallet: Keypair,
    programId?: PublicKey
  ): Promise<TrustLayer> {
    const provider = new AnchorProvider(
      connection,
      { publicKey: wallet.publicKey } as any,
      { commitment: 'confirmed' }
    );

    // Load program (would normally load from IDL)
    const program = {} as Program; // Placeholder - needs actual IDL
    
    return new TrustLayer(program, provider, wallet);
  }

  /**
   * Initialize an agent account
   * @param agentId Unique identifier for the agent (max 64 chars)
   * @returns Transaction signature
   */
  async initializeAgent(agentId: string): Promise<string> {
    if (agentId.length > 64) {
      throw new Error('Agent ID must be 64 characters or less');
    }

    const [agentPda] = await this.getAgentPda(agentId);

    const tx = await this.program.methods
      .initializeAgent(agentId)
      .accounts({
        agent: agentPda,
        authority: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([this.wallet])
      .rpc();

    return tx;
  }

  /**
   * Log a decision with input and logic
   * @param agentId Agent identifier
   * @param decision Decision object with input and logic
   * @returns Transaction signature and merkle root
   */
  async logDecision(
    agentId: string,
    decision: { input: string; logic: string }
  ): Promise<{ txSig: string; merkleRoot: string }> {
    if (decision.input.length > 256) {
      throw new Error('Input must be 256 characters or less');
    }
    if (decision.logic.length > 256) {
      throw new Error('Logic must be 256 characters or less');
    }

    const [agentPda] = await this.getAgentPda(agentId);
    const timestamp = Math.floor(Date.now() / 1000);
    const [memoryPda] = await this.getMemoryPda(agentPda, timestamp);

    // Compute merkle root locally for return value
    const inputHash = crypto.createHash('sha256').update(decision.input).digest();
    const logicHash = crypto.createHash('sha256').update(decision.logic).digest();
    const combined = Buffer.concat([inputHash, logicHash]);
    const merkleRoot = crypto.createHash('sha256').update(combined).digest('hex');

    const tx = await this.program.methods
      .logDecision(decision.input, decision.logic)
      .accounts({
        agent: agentPda,
        memoryLog: memoryPda,
        authority: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([this.wallet])
      .rpc();

    return { txSig: tx, merkleRoot };
  }

  /**
   * Attest to the outcome of a decision
   * @param agentId Agent identifier
   * @param memoryLog Memory log public key
   * @param outcome Outcome object
   * @returns Transaction signature
   */
  async attestOutcome(
    agentId: string,
    memoryLog: PublicKey,
    outcome: { data: string; success: boolean; scoreDelta: number }
  ): Promise<string> {
    if (outcome.data.length > 256) {
      throw new Error('Outcome must be 256 characters or less');
    }

    const [agentPda] = await this.getAgentPda(agentId);
    const [attestationPda] = await this.getAttestationPda(memoryLog);

    const tx = await this.program.methods
      .attestOutcome(outcome.data, outcome.success, new BN(outcome.scoreDelta))
      .accounts({
        agent: agentPda,
        memoryLog,
        attestation: attestationPda,
        authority: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([this.wallet])
      .rpc();

    return tx;
  }

  /**
   * Get agent account PDA
   */
  async getAgentPda(agentId: string): Promise<[PublicKey, number]> {
    return await PublicKey.findProgramAddress(
      [Buffer.from('agent'), Buffer.from(agentId)],
      this.program.programId
    );
  }

  /**
   * Get memory log PDA
   */
  async getMemoryPda(agentPubkey: PublicKey, timestamp: number): Promise<[PublicKey, number]> {
    const timestampBuffer = Buffer.alloc(8);
    timestampBuffer.writeBigInt64LE(BigInt(timestamp));
    
    return await PublicKey.findProgramAddress(
      [Buffer.from('memory'), agentPubkey.toBuffer(), timestampBuffer],
      this.program.programId
    );
  }

  /**
   * Get attestation PDA
   */
  async getAttestationPda(memoryLog: PublicKey): Promise<[PublicKey, number]> {
    return await PublicKey.findProgramAddress(
      [Buffer.from('attest'), memoryLog.toBuffer()],
      this.program.programId
    );
  }

  /**
   * Get agent account data
   */
  async getAgent(agentId: string) {
    const [agentPda] = await this.getAgentPda(agentId);
    return await this.program.account.agentAccount.fetch(agentPda);
  }

  /**
   * Get memory log data
   */
  async getMemoryLog(memoryLogPubkey: PublicKey) {
    return await this.program.account.memoryLog.fetch(memoryLogPubkey);
  }

  /**
   * Get attestation data
   */
  async getAttestation(attestationPubkey: PublicKey) {
    return await this.program.account.attestation.fetch(attestationPubkey);
  }
}

// Export types
export interface Decision {
  input: string;
  logic: string;
}

export interface Outcome {
  data: string;
  success: boolean;
  scoreDelta: number;
}

// Simple usage example
export async function example() {
  const connection = new Connection('https://api.devnet.solana.com');
  const wallet = Keypair.generate();
  
  const trustLayer = await TrustLayer.init(connection, wallet);
  
  // Initialize agent
  await trustLayer.initializeAgent('my-trading-bot');
  
  // Log a decision
  const { txSig, merkleRoot } = await trustLayer.logDecision('my-trading-bot', {
    input: 'SOL price dropped 15%',
    logic: 'Buy 10 SOL - oversold RSI'
  });
  
  console.log('Decision logged:', txSig);
  console.log('Merkle root:', merkleRoot);
  
  // Later: attest to outcome
  // await trustLayer.attestOutcome(agentId, memoryLogPubkey, {
  //   data: 'Profit: +8% (0.8 SOL)',
  //   success: true,
  //   scoreDelta: 10
  // });
}
