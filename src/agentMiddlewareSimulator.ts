import { findCollectionByFuzzyName } from './services/magicEden';
import { stdin as input, stdout as output } from 'node:process';
import * as readline from 'node:readline/promises';

// --- Mock NLU & Agent Actions ---
interface NLUEntity { collectionNameRaw?: string; [key: string]: any; }
interface NLUResult { intent?: string; confidence?: number; entities: NLUEntity; }

const mockAgent = {
  speak: (message: string) => console.log(`[AI AGENT]: ${message}`),
  showFloorPrice: (collection: { name: string, symbol: string }, price: number | string) => {
    mockAgent.speak(`The floor price for ${collection.name} (${collection.symbol}) is ${price}.`);
  },
  showCollectionStats: (collection: { name: string, symbol: string }, stats: any) => {
    mockAgent.speak(`Here are some stats for ${collection.name} (${collection.symbol}): ${JSON.stringify(stats)}`);
  },
  clarifyOrNotFound: (rawName: string) => {
    mockAgent.speak(`Sorry, I couldn't find a collection matching "${rawName}". Could you try a different name or check the spelling?`);
  },
  unknownIntent: () => {
    mockAgent.speak("I'm not sure what you'd like to do. You can ask for 'floor price of [collection]' or 'stats for [collection]'.");
  }
};

function parseUserIntentAndEntities(text: string): NLUResult {
  const S = text.toLowerCase();
  let intent: string | undefined;
  let collectionNameRaw: string | undefined;
  let confidence = 0.7; // Default confidence

  const floorPriceMatch = S.match(/(?:floor price of|floor for|price of)(.+)/i);
  const statsMatch = S.match(/(?:stats for|statistics for|get stats for)(.+)/i);
  const justNameMatch = S.match(/^(?:show me|find|get|lookup|search for|search)(.+)/i);

  if (floorPriceMatch && floorPriceMatch[1]) {
    intent = 'get_floor_price';
    collectionNameRaw = floorPriceMatch[1].trim();
  } else if (statsMatch && statsMatch[1]) {
    intent = 'get_collection_stats';
    collectionNameRaw = statsMatch[1].trim();
  } else if (justNameMatch && justNameMatch[1]) {
    // If it's just a name, assume they want general info, maybe stats?
    intent = 'get_collection_stats'; // Default to stats for a general lookup
    collectionNameRaw = justNameMatch[1].trim();
    confidence = 0.5; // Lower confidence if intent is inferred
  } else if (S.length > 2 && S.length < 50) { // Heuristic: if it's just a short phrase, might be a collection name
    intent = 'get_collection_stats'; // Default to stats
    collectionNameRaw = text.trim(); // Use original casing for lookup if intent is unclear
    confidence = 0.4;
  }
  
  // Remove common leading/trailing words like "please", "collection"
  if (collectionNameRaw) {
    collectionNameRaw = collectionNameRaw.replace(/\b(collection|nft|project|series|please)\b/gi, '').trim();
    // Remove extra spaces that might result from replacement
    collectionNameRaw = collectionNameRaw.replace(/\s{2,}/g, ' '); 
  }

  return { intent, confidence, entities: { collectionNameRaw } };
}

async function handleUserQuery(userInputText: string): Promise<void> {
  console.log(`\n[USER]: ${userInputText}`);
  const nluResult = parseUserIntentAndEntities(userInputText);

  if (nluResult.entities.collectionNameRaw) {
    const rawName = nluResult.entities.collectionNameRaw;
    mockAgent.speak(`Looking for a collection related to "${rawName}"...`);
    
    // Call our fuzzy finder
    // Using default pages (20, but will use cache if populated by a 100-page fetch previously)
    const resolvedCollection = await findCollectionByFuzzyName(rawName);

    if (resolvedCollection && resolvedCollection.symbol) {
      const { name: officialName, symbol: officialSymbol } = resolvedCollection;
      mockAgent.speak(`Found: ${officialName} (Symbol: ${officialSymbol}).`);

      switch (nluResult.intent) {
        case 'get_floor_price':
          // In a real scenario, you would call: 
          // const floorPriceData = await getFloorPrice(officialSymbol);
          // mockAgent.showFloorPrice(resolvedCollection, floorPriceData.floorPrice || 'Not available');
          mockAgent.showFloorPrice(resolvedCollection, `(simulated floor price for ${officialSymbol})`);
          break;
        case 'get_collection_stats':
          // In a real scenario, you would call:
          // const statsData = await getCollectionStats(officialSymbol);
          // mockAgent.showCollectionStats(resolvedCollection, statsData);
          mockAgent.showCollectionStats(resolvedCollection, { volume: '(simulated volume)', listed: '(simulated count)' });
          break;
        default:
          mockAgent.speak(`I found ${officialName}, but I'm not sure what you want to do with it. Defaulting to showing stats:`);
          mockAgent.showCollectionStats(resolvedCollection, { volume: '(simulated volume)', listed: '(simulated count)' });
          break;
      }
    } else {
      mockAgent.clarifyOrNotFound(rawName);
    }
  } else {
    mockAgent.unknownIntent();
  }
}

async function interactiveMode() {
  console.log("--- AI Agent Middleware Simulator (Interactive Mode) ---");
  console.log("Ask for 'floor price of [collection]' or 'stats for [collection]'. Type 'exit' to quit.");
  const rl = readline.createInterface({ input, output });

  // Initial cache warm-up if needed (optional, could be slow)
  // To ensure a good cache for the interactive session, let's try to pre-populate it with one of the popular collections.
  // This will use the current `allMagicEdenCollections_v2` cache key.
  // If it's cold, this first call will take time.
  console.log("[SYSTEM]: Optionally warming up collection cache if cold (Mad Lads, up to 100 pages)...");
  await findCollectionByFuzzyName("Mad Lads", 3, 100); // This will use/populate ALL_ME_COLLECTIONS_CACHE_KEY
  console.log("[SYSTEM]: Cache ready or was already warm.");

  let userInput = '';
  while ((userInput = await rl.question('[YOU]: ')) && userInput.toLowerCase() !== 'exit') {
    if (userInput.trim()) {
      await handleUserQuery(userInput);
    }
  }
  rl.close();
  console.log("[AI AGENT]: Goodbye!");
}

// Main execution
if (require.main === module) {
  interactiveMode().catch(err => {
    console.error("[FATAL ERROR IN SIMULATOR]:", err);
  });
} 