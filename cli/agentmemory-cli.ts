#!/usr/bin/env node

/**
 * AgentMemory CLI - Command-line tool for interacting with AgentMemory Protocol
 * 
 * Usage:
 *   agentmemory init <fee_pct> <royalty_pct> <fee_collector>
 *   agentmemory register <id> <name> <desc> <price> <ipfs_hash> <category>
 *   agentmemory purchase <module_id>
 *   agentmemory list
 *   agentmemory get <module_id>
 *   agentmemory download <module_id>
 */

import { Command } from 'commander';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { AgentMemoryClient, ModuleCategory } from '../sdk/index';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const program = new Command();

// Configuration
const DEFAULT_RPC = process.env.SOLANA_RPC || 'https://api.devnet.solana.com';
const DEFAULT_KEYPAIR = process.env.SOLANA_KEYPAIR || `${os.homedir()}/.config/solana/id.json`;

// Helper: Load wallet
function loadWallet(keypairPath?: string): Keypair {
  const path = keypairPath || DEFAULT_KEYPAIR;
  const secretKey = JSON.parse(fs.readFileSync(path, 'utf-8'));
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

// Helper: Create client
function createClient(rpc?: string, keypairPath?: string): AgentMemoryClient {
  const connection = new Connection(rpc || DEFAULT_RPC);
  const wallet = loadWallet(keypairPath);
  return new AgentMemoryClient(connection, { publicKey: wallet.publicKey, signTransaction: async (tx) => tx, signAllTransactions: async (txs) => txs });
}

// Command: Initialize platform
program
  .command('init')
  .description('Initialize AgentMemory platform (admin only)')
  .argument('<fee_pct>', 'Platform fee percentage (e.g., 5)')
  .argument('<royalty_pct>', 'Royalty percentage (e.g., 10)')
  .argument('<fee_collector>', 'Fee collector wallet address')
  .option('-r, --rpc <url>', 'RPC endpoint', DEFAULT_RPC)
  .option('-k, --keypair <path>', 'Keypair path', DEFAULT_KEYPAIR)
  .action(async (feePct, royaltyPct, feeCollector, options) => {
    try {
      const client = createClient(options.rpc, options.keypair);
      const feeCollectorPubkey = new PublicKey(feeCollector);
      
      console.log('🚀 Initializing AgentMemory platform...');
      console.log(`   Fee: ${feePct}%`);
      console.log(`   Royalty: ${royaltyPct}%`);
      console.log(`   Fee Collector: ${feeCollector}`);
      
      const tx = await client.initialize(
        parseInt(feePct),
        parseInt(royaltyPct),
        feeCollectorPubkey
      );
      
      console.log(`✅ Initialized! Tx: ${tx}`);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Command: Register module
program
  .command('register')
  .description('Register a new memory module')
  .argument('<id>', 'Module ID (e.g., bitemporal-v1)')
  .argument('<name>', 'Module name')
  .argument('<description>', 'Module description')
  .argument('<price_sol>', 'Price in SOL (e.g., 0.1)')
  .argument('<ipfs_hash>', 'IPFS hash (Qm... or bafy...)')
  .argument('<category>', 'Category: BiTemporal|Procedural|Semantic|Episodic|Custom')
  .option('-r, --rpc <url>', 'RPC endpoint', DEFAULT_RPC)
  .option('-k, --keypair <path>', 'Keypair path', DEFAULT_KEYPAIR)
  .action(async (id, name, description, priceSol, ipfsHash, category, options) => {
    try {
      const client = createClient(options.rpc, options.keypair);
      
      if (!Object.values(ModuleCategory).includes(category as ModuleCategory)) {
        throw new Error(`Invalid category. Must be one of: ${Object.values(ModuleCategory).join(', ')}`);
      }
      
      console.log('📦 Registering module...');
      console.log(`   ID: ${id}`);
      console.log(`   Name: ${name}`);
      console.log(`   Price: ${priceSol} SOL`);
      console.log(`   IPFS: ${ipfsHash}`);
      console.log(`   Category: ${category}`);
      
      const tx = await client.registerModule(
        id,
        name,
        description,
        parseFloat(priceSol),
        ipfsHash,
        category as ModuleCategory
      );
      
      console.log(`✅ Registered! Tx: ${tx}`);
      console.log(`🔗 View on Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Command: Purchase module
program
  .command('purchase')
  .description('Purchase a memory module')
  .argument('<module_id>', 'Module ID to purchase')
  .option('-r, --rpc <url>', 'RPC endpoint', DEFAULT_RPC)
  .option('-k, --keypair <path>', 'Keypair path', DEFAULT_KEYPAIR)
  .action(async (moduleId, options) => {
    try {
      const client = createClient(options.rpc, options.keypair);
      
      console.log('💰 Purchasing module...');
      console.log(`   Module: ${moduleId}`);
      
      // Get module info first
      const module = await client.getModule(moduleId);
      console.log(`   Price: ${module.price / 1e9} SOL`);
      console.log(`   Creator: ${module.creator.toBase58()}`);
      
      const tx = await client.purchaseModule(moduleId);
      
      console.log(`✅ Purchased! Tx: ${tx}`);
      console.log(`🔗 View on Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
      console.log(`📥 Download with: agentmemory download ${moduleId}`);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Command: Get module info
program
  .command('get')
  .description('Get module information')
  .argument('<module_id>', 'Module ID')
  .option('-r, --rpc <url>', 'RPC endpoint', DEFAULT_RPC)
  .option('-k, --keypair <path>', 'Keypair path', DEFAULT_KEYPAIR)
  .action(async (moduleId, options) => {
    try {
      const client = createClient(options.rpc, options.keypair);
      
      console.log('🔍 Fetching module info...');
      const module = await client.getModule(moduleId);
      
      console.log(`\n📦 Module: ${module.name}`);
      console.log(`   ID: ${module.moduleId}`);
      console.log(`   Description: ${module.description}`);
      console.log(`   Price: ${module.price / 1e9} SOL`);
      console.log(`   Category: ${module.category}`);
      console.log(`   Creator: ${module.creator.toBase58()}`);
      console.log(`   IPFS: ${module.ipfsHash}`);
      console.log(`   Created: ${new Date(module.createdAt * 1000).toISOString()}`);
      console.log(`   Purchases: ${module.totalPurchases}`);
      console.log(`   Revenue: ${module.totalRevenue / 1e9} SOL`);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Command: Download module
program
  .command('download')
  .description('Download module content from IPFS')
  .argument('<module_id>', 'Module ID')
  .option('-r, --rpc <url>', 'RPC endpoint', DEFAULT_RPC)
  .option('-k, --keypair <path>', 'Keypair path', DEFAULT_KEYPAIR)
  .option('-o, --output <path>', 'Output file path')
  .action(async (moduleId, options) => {
    try {
      const client = createClient(options.rpc, options.keypair);
      
      console.log('📥 Downloading module...');
      const content = await client.downloadModule(moduleId);
      
      if (options.output) {
        fs.writeFileSync(options.output, content);
        console.log(`✅ Saved to: ${options.output}`);
      } else {
        console.log('\n' + '='.repeat(80));
        console.log(content);
        console.log('='.repeat(80));
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Command: Check ownership
program
  .command('owns')
  .description('Check if you own a module')
  .argument('<module_id>', 'Module ID')
  .option('-r, --rpc <url>', 'RPC endpoint', DEFAULT_RPC)
  .option('-k, --keypair <path>', 'Keypair path', DEFAULT_KEYPAIR)
  .action(async (moduleId, options) => {
    try {
      const client = createClient(options.rpc, options.keypair);
      const wallet = loadWallet(options.keypair);
      
      const owns = await client.hasPurchased(wallet.publicKey, moduleId);
      
      if (owns) {
        console.log(`✅ You own module: ${moduleId}`);
        
        const purchase = await client.getPurchase(wallet.publicKey, moduleId);
        if (purchase) {
          console.log(`   Purchased: ${new Date(purchase.purchasedAt * 1000).toISOString()}`);
        }
      } else {
        console.log(`❌ You do not own module: ${moduleId}`);
        console.log(`   Purchase with: agentmemory purchase ${moduleId}`);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Parse and execute
program
  .name('agentmemory')
  .description('CLI tool for AgentMemory Protocol')
  .version('2.0.0')
  .parse(process.argv);
