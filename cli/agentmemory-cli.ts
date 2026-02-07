#!/usr/bin/env node

import { Command } from "commander";
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Wallet } from "@coral-xyz/anchor";
import { AgentMemoryClient } from "../sdk/index";
import * as fs from "fs";
import * as os from "os";

const cli = new Command();

const DEFAULT_RPC =
  process.env.SOLANA_RPC || "https://api.devnet.solana.com";
const DEFAULT_KEYPAIR =
  process.env.SOLANA_KEYPAIR || `${os.homedir()}/.config/solana/id.json`;

function loadKeypair(keypairPath?: string): Keypair {
  const p = keypairPath || DEFAULT_KEYPAIR;
  const secretKey = JSON.parse(fs.readFileSync(p, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

function createClient(
  rpc?: string,
  keypairPath?: string,
  programId?: string
): AgentMemoryClient {
  const connection = new Connection(rpc || DEFAULT_RPC, "confirmed");
  const kp = loadKeypair(keypairPath);
  const wallet = new Wallet(kp);

  const pid = programId
    ? new PublicKey(programId)
    : new PublicKey(
        JSON.parse(
          fs.readFileSync(
            `${__dirname}/../target/idl/agentmemory.json`,
            "utf-8"
          )
        ).metadata?.address || "11111111111111111111111111111111"
      );

  return new AgentMemoryClient(connection, wallet, pid);
}

cli
  .name("agentmemory")
  .description("CLI for AgentMemory Protocol on Solana")
  .version("2.0.0")
  .option("-r, --rpc <url>", "RPC endpoint", DEFAULT_RPC)
  .option("-k, --keypair <path>", "Keypair file path", DEFAULT_KEYPAIR)
  .option("-p, --program-id <address>", "Program ID override");

cli
  .command("init-platform")
  .description("Initialize platform config (admin, one-time)")
  .argument("<treasury>", "Treasury wallet address")
  .argument("<platform_fee_bps>", "Platform fee in basis points (e.g. 500 = 5%)")
  .argument("<referral_fee_bps>", "Referral fee in basis points (e.g. 500 = 5%)")
  .action(async (treasury, platformFeeBps, referralFeeBps) => {
    try {
      const opts = cli.opts();
      const client = createClient(opts.rpc, opts.keypair, opts.programId);
      const treasuryPk = new PublicKey(treasury);

      console.log("Initializing platform...");
      console.log(`  Treasury: ${treasury}`);
      console.log(`  Platform fee: ${platformFeeBps} bps`);
      console.log(`  Referral fee: ${referralFeeBps} bps`);

      const tx = await client.initializePlatform(
        treasuryPk,
        parseInt(platformFeeBps),
        parseInt(referralFeeBps)
      );

      console.log(`Done. Tx: ${tx}`);
      console.log(
        `Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`
      );
    } catch (error: any) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

cli
  .command("init-agent")
  .description("Initialize an agent account")
  .argument("<agent_id>", "Agent identifier (max 64 chars)")
  .action(async (agentId) => {
    try {
      const opts = cli.opts();
      const client = createClient(opts.rpc, opts.keypair, opts.programId);

      console.log(`Initializing agent: ${agentId}`);
      const tx = await client.initializeAgent(agentId);

      console.log(`Done. Tx: ${tx}`);
      console.log(
        `Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`
      );
    } catch (error: any) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

cli
  .command("log")
  .description("Log an agent decision on-chain")
  .argument("<agent_id>", "Agent identifier")
  .argument("<input_data>", "Input context (max 256 chars)")
  .argument("<logic_data>", "Decision logic (max 256 chars)")
  .action(async (agentId, inputData, logicData) => {
    try {
      const opts = cli.opts();
      const client = createClient(opts.rpc, opts.keypair, opts.programId);

      console.log(`Logging decision for agent: ${agentId}`);
      console.log(`  Input: ${inputData}`);
      console.log(`  Logic: ${logicData}`);

      const result = await client.logDecision(agentId, inputData, logicData);

      console.log(`Done. Tx: ${result.tx}`);
      console.log(`Memory log: ${result.memoryLogPubkey.toBase58()}`);
      console.log(
        `Explorer: https://explorer.solana.com/tx/${result.tx}?cluster=devnet`
      );
    } catch (error: any) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

cli
  .command("attest")
  .description("Attest outcome of a logged decision")
  .argument("<agent_id>", "Agent identifier")
  .argument("<memory_log>", "Memory log account address")
  .argument("<outcome_data>", "Outcome description (max 256 chars)")
  .argument("<success>", "Was outcome successful? (true/false)")
  .argument("<score_delta>", "Reputation score change (integer)")
  .action(async (agentId, memoryLog, outcomeData, success, scoreDelta) => {
    try {
      const opts = cli.opts();
      const client = createClient(opts.rpc, opts.keypair, opts.programId);
      const memoryLogPk = new PublicKey(memoryLog);
      const isSuccess = success === "true";

      console.log(`Attesting outcome for agent: ${agentId}`);
      console.log(`  Memory log: ${memoryLog}`);
      console.log(`  Success: ${isSuccess}`);
      console.log(`  Score delta: ${scoreDelta}`);

      const tx = await client.attestOutcome(
        agentId,
        memoryLogPk,
        outcomeData,
        isSuccess,
        parseInt(scoreDelta)
      );

      console.log(`Done. Tx: ${tx}`);
      console.log(
        `Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`
      );
    } catch (error: any) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

cli
  .command("register")
  .description("Register a memory module for sale")
  .argument("<module_id>", "Module identifier (max 64 chars)")
  .argument("<price_lamports>", "Price in lamports (min 1000000)")
  .argument("<royalty_bps>", "Royalty in basis points (max 10000)")
  .argument("<ipfs_hash>", "IPFS content hash (Qm... or bafy...)")
  .action(async (moduleId, priceLamports, royaltyBps, ipfsHash) => {
    try {
      const opts = cli.opts();
      const client = createClient(opts.rpc, opts.keypair, opts.programId);

      console.log(`Registering module: ${moduleId}`);
      console.log(`  Price: ${priceLamports} lamports (${parseInt(priceLamports) / LAMPORTS_PER_SOL} SOL)`);
      console.log(`  Royalty: ${royaltyBps} bps`);
      console.log(`  IPFS: ${ipfsHash}`);

      const tx = await client.registerModule(
        moduleId,
        parseInt(priceLamports),
        parseInt(royaltyBps),
        ipfsHash
      );

      console.log(`Done. Tx: ${tx}`);
      console.log(
        `Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`
      );
    } catch (error: any) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

cli
  .command("purchase")
  .description("Purchase a memory module")
  .argument("<module_id>", "Module ID to purchase")
  .argument("<agent_id>", "Your agent ID (must be initialized)")
  .option("--referrer <address>", "Optional referrer wallet address")
  .action(async (moduleId, agentId, options) => {
    try {
      const opts = cli.opts();
      const client = createClient(opts.rpc, opts.keypair, opts.programId);
      const referrer = options.referrer
        ? new PublicKey(options.referrer)
        : undefined;

      const mod = await client.getModule(moduleId);
      console.log(`Purchasing module: ${moduleId}`);
      console.log(`  Price: ${mod.priceLamports / LAMPORTS_PER_SOL} SOL`);
      console.log(`  Creator: ${mod.creator.toBase58()}`);

      const tx = await client.purchaseModule(moduleId, agentId, referrer);

      console.log(`Done. Tx: ${tx}`);
      console.log(
        `Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`
      );
    } catch (error: any) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

cli
  .command("get-agent")
  .description("Get agent account details")
  .argument("<agent_id>", "Agent identifier")
  .action(async (agentId) => {
    try {
      const opts = cli.opts();
      const client = createClient(opts.rpc, opts.keypair, opts.programId);
      const agent = await client.getAgent(agentId);

      console.log(`Agent: ${agent.agentId}`);
      console.log(`  Authority: ${agent.authority.toBase58()}`);
      console.log(`  Reputation: ${agent.reputation}`);
      console.log(`  Total logs: ${agent.totalLogs}`);
      console.log(`  Total attestations: ${agent.totalAttestations}`);
    } catch (error: any) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

cli
  .command("get-module")
  .description("Get module metadata")
  .argument("<module_id>", "Module identifier")
  .action(async (moduleId) => {
    try {
      const opts = cli.opts();
      const client = createClient(opts.rpc, opts.keypair, opts.programId);
      const mod = await client.getModule(moduleId);

      console.log(`Module: ${mod.moduleId}`);
      console.log(`  Creator: ${mod.creator.toBase58()}`);
      console.log(`  Price: ${mod.priceLamports / LAMPORTS_PER_SOL} SOL (${mod.priceLamports} lamports)`);
      console.log(`  Royalty: ${mod.royaltyBps} bps`);
      console.log(`  IPFS: ${mod.ipfsHash}`);
      console.log(`  Active: ${mod.isActive}`);
      console.log(`  Sales: ${mod.totalSales}`);
      console.log(`  Revenue: ${mod.totalRevenue / LAMPORTS_PER_SOL} SOL`);
    } catch (error: any) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

cli.parse(process.argv);
