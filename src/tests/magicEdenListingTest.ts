import { getListingInstruction } from '../services/magicEden';

// Test NFT data
const TEST_DATA = {
  seller: '3Rw7MvVBWVHo2BwxxkVqYLhsDPtkz1FCszWRArjzKFYu', // Example wallet
  tokenMint: 'F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk', // Example NFT
  tokenAccount: '8hsBqcfZqWKRA2NfLWHvDYqpkJ2kYZGKkUduWckuvPGi', // Example token account
  price: 50 // 50 SOL
};

async function testListingInstruction() {
  console.log('Testing NFT listing instruction generation...');
  console.log('Test Data:', JSON.stringify(TEST_DATA, null, 2));
  
  try {
    const instruction = await getListingInstruction({
      seller: TEST_DATA.seller,
      tokenMint: TEST_DATA.tokenMint,
      tokenAccount: TEST_DATA.tokenAccount,
      price: TEST_DATA.price
    });
    
    console.log('\n===== LISTING INSTRUCTION RESPONSE =====');
    console.log('Transaction Signed:', instruction.txSigned);
    console.log('Transaction ID:', instruction.txid);
    console.log('\nTransaction (Base64):');
    console.log(instruction.tx);
    
    console.log('\nNext steps:');
    console.log('1. Sign the transaction using your wallet');
    console.log('2. Submit the signed transaction to the Solana network');
    
  } catch (error) {
    console.error('Error generating listing instruction:');
    console.error(error);
  }
}

// Run the test
(async () => {
  await testListingInstruction();
})(); 