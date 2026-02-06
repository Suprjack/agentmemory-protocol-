#!/usr/bin/env node

/**
 * Upload memory modules to IPFS
 * 
 * Usage:
 *   node upload-to-ipfs.js <file_path>
 *   node upload-to-ipfs.js <file_path> --pinata-key <key> --pinata-secret <secret>
 */

const fs = require('fs');
const https = require('https');
const FormData = require('form-data');

// IPFS Upload Options

// Option 1: Free public gateway (no persistence guarantee)
async function uploadToPublicIPFS(filePath) {
  console.log('⚠️  Using public IPFS gateway (no persistence guarantee)');
  console.log('   For production, use Pinata, Web3.Storage, or NFT.Storage');
  
  // Use ipfs.tech API
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'ipfs.tech',
      path: '/api/v0/add',
      method: 'POST',
      headers: form.getHeaders(),
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.Hash);
        } catch (e) {
          reject(new Error('Failed to parse IPFS response'));
        }
      });
    });
    
    req.on('error', reject);
    form.pipe(req);
  });
}

// Option 2: Pinata (recommended for production)
async function uploadToPinata(filePath, apiKey, apiSecret) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  
  const metadata = JSON.stringify({
    name: filePath.split('/').pop(),
  });
  form.append('pinataMetadata', metadata);
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.pinata.cloud',
      path: '/pinning/pinFileToIPFS',
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': apiSecret,
      },
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.IpfsHash) {
            resolve(result.IpfsHash);
          } else {
            reject(new Error(`Pinata error: ${JSON.stringify(result)}`));
          }
        } catch (e) {
          reject(new Error('Failed to parse Pinata response'));
        }
      });
    });
    
    req.on('error', reject);
    form.pipe(req);
  });
}

// Option 3: Web3.Storage (free, recommended for hackathon)
async function uploadToWeb3Storage(filePath, apiToken) {
  const { Web3Storage, File } = await import('web3.storage');
  
  const client = new Web3Storage({ token: apiToken });
  const content = fs.readFileSync(filePath);
  const fileName = filePath.split('/').pop();
  
  const file = new File([content], fileName);
  const cid = await client.put([file]);
  
  return cid;
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node upload-to-ipfs.js <file_path> [options]');
    console.error('');
    console.error('Options:');
    console.error('  --pinata-key <key>           Pinata API key');
    console.error('  --pinata-secret <secret>     Pinata API secret');
    console.error('  --web3storage-token <token>  Web3.Storage API token');
    console.error('');
    console.error('Examples:');
    console.error('  node upload-to-ipfs.js memory-module.md');
    console.error('  node upload-to-ipfs.js memory-module.md --pinata-key xxx --pinata-secret yyy');
    console.error('  node upload-to-ipfs.js memory-module.md --web3storage-token xxx');
    process.exit(1);
  }
  
  const filePath = args[0];
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }
  
  // Parse options
  const pinataKey = args.includes('--pinata-key') 
    ? args[args.indexOf('--pinata-key') + 1] 
    : process.env.PINATA_API_KEY;
  const pinataSecret = args.includes('--pinata-secret')
    ? args[args.indexOf('--pinata-secret') + 1]
    : process.env.PINATA_SECRET_API_KEY;
  const web3Token = args.includes('--web3storage-token')
    ? args[args.indexOf('--web3storage-token') + 1]
    : process.env.WEB3_STORAGE_TOKEN;
  
  console.log(`📤 Uploading: ${filePath}`);
  console.log(`   Size: ${fs.statSync(filePath).size} bytes`);
  
  let ipfsHash;
  
  try {
    if (web3Token) {
      console.log('🌐 Using Web3.Storage...');
      ipfsHash = await uploadToWeb3Storage(filePath, web3Token);
    } else if (pinataKey && pinataSecret) {
      console.log('📌 Using Pinata...');
      ipfsHash = await uploadToPinata(filePath, pinataKey, pinataSecret);
    } else {
      console.log('🆓 Using public IPFS gateway...');
      ipfsHash = await uploadToPublicIPFS(filePath);
    }
    
    console.log('');
    console.log('✅ Upload successful!');
    console.log('');
    console.log(`📦 IPFS Hash: ${ipfsHash}`);
    console.log(`🔗 Gateway URL: https://ipfs.io/ipfs/${ipfsHash}`);
    console.log(`🔗 Pinata URL: https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
    console.log('');
    console.log('Use this hash when registering your module:');
    console.log(`   agentmemory register <id> <name> <desc> <price> ${ipfsHash} <category>`);
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }
}

main();
