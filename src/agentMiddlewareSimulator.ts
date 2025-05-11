import { getFloorPrice, getCollectionStats, findCollectionByFuzzyName } from './services/magicEden';
import { stdin as input, stdout as output } from 'node:process';
import * as readline from 'node:readline/promises';
import { geminiNLU, geminiPhraseResponse } from './services/geminiService';

// --- Mock NLU & Agent Actions ---
interface NLUEntity { collectionNameRaw?: string; [key: string]: any; }
interface NLUResult { intent?: string; confidence?: number; entities: NLUEntity; }

const mockAgent = {
  clarifyOrNotFound: (rawName: string) => {
    console.log(`[AI AGENT]: Sorry, I couldn't find a collection matching "${rawName}". Could you try a different name or check the spelling?`);
  },
  unknownIntent: () => {
    console.log("[AI AGENT]: I'm not sure what you'd like to do. You can ask for 'floor price of [collection]' or 'stats for [collection]'.");
  }
};

function parseUserIntentAndEntities(text: string): NLUResult {
  const S = text.toLowerCase();
  let intent: string | undefined;
  let collectionNameRaw: string | undefined;
  let confidence = 0.7; // Default confidence

  const floorPriceMatch = S.match(/(?:floor price of|floor price for|floor for|price of|price for)\s+(.+)/i);
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
  // Use Gemini for NLU
  const nluResult = await geminiNLU(userInputText);

  if (nluResult.entities.collectionNameRaw) {
    const rawName = nluResult.entities.collectionNameRaw;
    console.log(`[AI AGENT]: Processing request for "${rawName}"...`);
    try {
      switch (nluResult.intent) {
        case 'get_floor_price': {
          const floorPriceData = await getFloorPrice(rawName);
          if (floorPriceData && floorPriceData.floorPrice !== null) {
            // Try to get the resolved collection info for phrasing
            const matchedCollection = await findCollectionByFuzzyName(rawName);
            const collection = matchedCollection || { name: rawName, symbol: '(unknown)' };
            const phrased = await geminiPhraseResponse({ action: 'floor_price', collection, data: floorPriceData });
            console.log(`[AI AGENT]: ${phrased}`);
          } else {
            mockAgent.clarifyOrNotFound(rawName + ' (could not retrieve floor price)');
          }
          break;
        }
        case 'get_collection_stats': {
          const statsData = await getCollectionStats(rawName);
          if (statsData) {
            const matchedCollection = await findCollectionByFuzzyName(rawName);
            const collection = matchedCollection || { name: rawName, symbol: statsData.symbol };
            const phrased = await geminiPhraseResponse({ action: 'collection_stats', collection, data: statsData });
            console.log(`[AI AGENT]: ${phrased}`);
          } else {
            mockAgent.clarifyOrNotFound(rawName + ' (could not retrieve stats)');
          }
          break;
        }
        default: {
          // Unknown intent, fallback to stats
          const statsData = await getCollectionStats(rawName);
          if (statsData) {
            const matchedCollection = await findCollectionByFuzzyName(rawName);
            const collection = matchedCollection || { name: rawName, symbol: statsData.symbol };
            const phrased = await geminiPhraseResponse({ action: 'collection_stats', collection, data: statsData });
            console.log(`[AI AGENT]: ${phrased}`);
          } else {
            mockAgent.clarifyOrNotFound(rawName + ' (could not retrieve stats for default action)');
          }
          break;
        }
      }
    } catch (error) {
      console.error(`[SIMULATOR ERROR] Error processing "${rawName}":`, error);
      mockAgent.clarifyOrNotFound(rawName + ` (error: ${error instanceof Error ? error.message : 'Unknown error'})`);
    }
  } else {
    mockAgent.unknownIntent();
  }
}

async function interactiveMode() {
  console.log("--- AI Agent Middleware Simulator (Interactive Mode) ---");
  console.log("Ask for 'floor price of [collection]' or 'stats for [collection]'. Type 'exit' to quit.");
  const rl = readline.createInterface({ input, output });

  // Initial cache warm-up for allCollections is still useful for the underlying findCollectionByFuzzyName
  // Now fetch up to 100 pages (50k collections) for the cache
  console.log("[SYSTEM]: Warming up collection cache with 100 pages (up to 50k collections, e.g., by fetching 'Mad Lads')...");
  try {
    await findCollectionByFuzzyName("Mad Lads", 3, 100); // This will trigger a large fetch and cache
    console.log("[SYSTEM]: Cache ready or was already warm (100 pages).");
  } catch (e) {
    console.warn("[SYSTEM]: Optional cache warm-up for 'Mad Lads' might have failed (e.g., if not found initially), but the simulator will proceed.");
  }

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