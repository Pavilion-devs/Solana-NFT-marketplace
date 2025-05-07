import { getNFTMetadata } from '../services/helius';
import axios from 'axios';
import { config } from '../config/env';

// Define a known NFT mint address to test with
const TEST_NFT_MINT = 'F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk'; // Example from documentation
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${config.heliusApiKey}`;

// Function to test the direct RPC call
async function testDirectRpcCall() {
  console.log(`Making direct RPC call for NFT mint: ${TEST_NFT_MINT}`);
  
  try {
    const response = await axios.post(HELIUS_RPC_URL, {
      jsonrpc: "2.0",
      id: "my-id",
      method: "getAsset",
      params: {
        id: TEST_NFT_MINT
      }
    });
    
    if (response.data && response.data.result) {
      // Log important sections to understand the structure
      const asset = response.data.result;
      
      console.log('\n===== CONTENT SECTION =====');
      console.log(JSON.stringify(asset.content, null, 2));
      
      console.log('\n===== GROUPING SECTION =====');
      console.log(JSON.stringify(asset.grouping, null, 2));
      
      console.log('\n===== ROYALTY SECTION =====');
      console.log(JSON.stringify(asset.royalty, null, 2));
      
      console.log('\n===== OWNERSHIP SECTION =====');
      console.log(JSON.stringify(asset.ownership, null, 2));
    }
  } catch (error) {
    console.error('Error with direct RPC call:', error);
  }
}

// Function to test the NFT metadata fetch
async function testGetNFTMetadata() {
  console.log(`Testing getNFTMetadata with mint address: ${TEST_NFT_MINT}`);
  
  try {
    // Fetch the NFT metadata
    const metadata = await getNFTMetadata(TEST_NFT_MINT);
    
    console.log('\n===== NFT METADATA =====');
    console.log(`Mint: ${metadata.mint}`);
    console.log(`Name: ${metadata.name}`);
    console.log(`Symbol: ${metadata.symbol}`);
    console.log(`Image: ${metadata.image}`);
    
    if (metadata.collection) {
      console.log(`Collection: ${metadata.collection.name}`);
      console.log(`Collection Family: ${metadata.collection.family}`);
    }
    
    console.log(`Owner: ${metadata.owner}`);
    console.log(`Token Account: ${metadata.tokenAccount}`);
    console.log(`Update Authority: ${metadata.updateAuthority}`);
    console.log(`Seller Fee Basis Points: ${metadata.sellerFeeBasisPoints}`);
    console.log(`Primary Sale Happened: ${metadata.primarySaleHappened}`);
    
    if (metadata.attributes && metadata.attributes.length > 0) {
      console.log('\nAttributes:');
      metadata.attributes.forEach(attr => {
        console.log(`  ${attr.trait_type}: ${attr.value}`);
      });
    }
    
    // Print the full raw metadata for debugging
    console.log('\n===== RAW METADATA =====');
    console.log(JSON.stringify(metadata, null, 2));
    
  } catch (error) {
    console.error('Error fetching NFT metadata:');
    console.error(error);
  }
}

// Run the tests
console.log('=== TESTING DIRECT RPC CALL ===');
await testDirectRpcCall();

console.log('\n\n=== TESTING METADATA SERVICE ===');
await testGetNFTMetadata(); 