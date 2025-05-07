import { getTrendingCollections } from '../services/magicEden';

// Function to print a collection in a readable format
const printCollection = (collection: any, index: number) => {
  console.log(`\n==== Collection ${index + 1} ====`);
  console.log(`Symbol: ${collection.symbol}`);
  console.log(`Name: ${collection.name}`);
  console.log(`Description: ${collection.description}`);
  console.log(`Image: ${collection.image}`);
  console.log(`Floor Price (SOL): ${collection.floorPrice}`);
  console.log(`Volume All: ${collection.volumeAll}`);
  console.log(`Has CNFTs: ${collection.hasCNFTs || false}`);
  console.log('======================\n');
};

// Function to test the API
async function testMagicEdenAPI() {
  console.log('Fetching Magic Eden trending collections...');
  
  try {
    // Get trending collections with a limit of 5
    const collections = await getTrendingCollections(5, 0);
    
    console.log('\n===== MAGIC EDEN TRENDING COLLECTIONS =====');
    
    // Print each collection in a readable format
    collections.forEach((collection, index) => {
      printCollection(collection, index);
    });
    
    // Also print the raw JSON for reference
    console.log('\n===== RAW JSON DATA =====');
    console.log(JSON.stringify(collections, null, 2));
    
  } catch (error) {
    console.error('Error fetching Magic Eden trending collections:');
    console.error(error);
  }
}

// Run the test
testMagicEdenAPI(); 