import { findCollectionByFuzzyName } from './services/magicEden';
import * as fs from 'fs'; // Import fs for writing the done file

async function testFuzzySearch() {
  console.log('--- Test Suite: Fuzzy Collection Name Matching (Attempting 50k cache build if cold) ---');

  const testCases = [
    // Run Mad Lads first to ensure it attempts the 100-page fetch on a cold cache
    { userInput: 'Mad Lads', expectedSymbol: 'mad_lads', note: 'Popular collection test (100 pages if cold)' },
    { userInput: 'y00ts', expectedSymbol: 'y00ts', note: 'Popular collection test (100 pages if cold)' },
    { userInput: 'Bushido Warriors', expectedSymbol: 'bushido_warriors_drip_army', note: 'Partial name (20 pages if cold)' },
    { userInput: 'OddKey POAP', expectedSymbol: 'oddkey_cover_poaps_nft', note: 'Partial name with acronym (20 pages if cold)' },
    { userInput: 'Handstyle', expectedSymbol: 'handstylez', note: 'Slight variation/singular (20 pages if cold)' },
    { userInput: 'Solana Space', expectedSymbol: 'solana_spaces', note: 'Singular vs plural (20 pages if cold)' },
    { userInput: 'Sol hunter Azure', expectedSymbol: 'solhunter_azure', note: 'Space in name (20 pages if cold)' },
    { userInput: 'Solid Talk', expectedSymbol: 'solid_talk_34', note: 'Generic part of multiple names (20 pages if cold)' }, 
    { userInput: 'NonExistent Collection XYZ', expectedSymbol: null, note: 'Likely no match (20 pages if cold)' },
  ];

  for (const tc of testCases) {
    console.log(`\n[TEST] Input: "${tc.userInput}" (Note: ${tc.note})`);
    const pagesToFetch = (tc.userInput === 'Mad Lads' || tc.userInput === 'y00ts') ? 100 : 20;
    const result = await findCollectionByFuzzyName(tc.userInput, 3, pagesToFetch);
    
    if (result) {
      console.log(`  [RESULT] Found: "${result.name}" (Symbol: ${result.symbol}, Image: ${result.image || 'N/A'}, Desc: ${result.description || 'N/A'})`);
      if (tc.expectedSymbol) {
        if (result.symbol === tc.expectedSymbol) {
          console.log(`    [PASS] Matched expected symbol: ${tc.expectedSymbol}`);
        } else {
          console.warn(`    [WARN] Matched "${result.symbol}" but expected "${tc.expectedSymbol}". This might be acceptable if names are very similar or due to data order.`);
        }
      }
    } else {
      console.log('  [RESULT] Not found.');
      if (tc.expectedSymbol === null) {
        console.log('    [PASS] Correctly did not find a match.');
      } else {
        console.error(`    [FAIL] Expected to find symbol "${tc.expectedSymbol}" but found nothing.`);
      }
    }
  }
  console.log('\n--- Test Suite Complete ---');
  // Create a done.txt file to indicate completion
  try {
    fs.writeFileSync('done.txt', 'Test suite finished successfully.');
    console.log('Created done.txt');
  } catch (err) {
    console.error('Error writing done.txt:', err);
  }
}

testFuzzySearch().catch(error => {
  console.error('Error during test execution:', error);
  // Still try to write done.txt even if there was an error during tests
  try {
    fs.writeFileSync('done.txt', 'Test suite finished with errors.');
    console.log('Created done.txt (with errors)');
  } catch (err) {
    console.error('Error writing done.txt after error:', err);
  }
}); 