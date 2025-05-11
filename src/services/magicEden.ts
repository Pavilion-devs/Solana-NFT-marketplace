import { fetchData } from '../utils/fetch';
import { cache } from '../utils/cache';
import { config } from '../config/env';
import axios from 'axios';
import { closest, distance } from 'fastest-levenshtein';

// Types
interface Collection {
  symbol: string;
  name: string;
  image: string;
  description?: string;
  twitter?: string;
  discord?: string;
  website?: string;
  categories?: string[];
}

interface FloorPrice {
  floorPrice: number | null; // in SOL, can be null if not available
  listed: number;
  currency: string;
  updatedAt: string;
}

interface CollectionStats {
  symbol: string;
  volumeAll: number;
  volume24hr: number;
  avgPrice24hr: number;
  floorPrice: number | null;
  listedCount: number;
  listedTotalValue: number;
}

interface TrendingCollection extends Collection {
  volume24hr: number;
  volumeAll: number;
}

interface CollectionActivity {
  type: 'list' | 'delist' | 'buy' | 'sell' | 'updateList';
  signature: string;
  price: number;
  blockTime: number;
  mint: string;
  buyerAddress?: string;
  sellerAddress?: string;
}

interface NFTMetadata {
  mint: string;
  name: string;
  symbol: string;
  image: string;
  attributes?: {
    trait_type: string;
    value: string;
  }[];
  collection?: {
    name: string;
    family: string;
  };
  owner?: string;
  tokenAccount?: string;
  sellerFeeBasisPoints?: number;
  primarySaleHappened?: boolean;
  updateAuthority?: string;
}

interface WalletNFTs {
  tokens: NFTMetadata[];
  totalItems: number;
}

// Interface for collections from /v2/collections endpoint
// Assuming a simpler structure for now, will adjust if API returns more/less
interface BasicCollection {
  symbol: string;
  name: string;
  image?: string; // Optional, may not be in all basic listings
  description?: string; // Optional
}

const ALL_ME_COLLECTIONS_CACHE_KEY = 'allMagicEdenCollections_v2'; // Reverted to a stable key for the ~30k dataset
const ALL_ME_COLLECTIONS_CACHE_DURATION_SECONDS = 4 * 60 * 60; // 4 hours

// Base URL for Magic Eden API
const BASE_URL = 'https://api-mainnet.magiceden.dev/v2';

// Magic Eden's internal API used by their fronten
// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 10, // Maximum requests per window
  windowMs: 1000, // Time window in milliseconds (1 second)
  queue: [] as number[] // Queue to track request timestamps
};

// Add debug logging for API responses
const logApiResponse = (endpoint: string, response: any) => {
  console.log(`[MagicEden API] ${endpoint} Response:`, JSON.stringify(response, null, 2));
};

/**
 * Check and update rate limit queue
 * Returns a promise that resolves when it's safe to make a request
 */
async function checkRateLimit(): Promise<void> {
  const now = Date.now();
  
  // Remove timestamps older than the window
  RATE_LIMIT.queue = RATE_LIMIT.queue.filter(
    timestamp => now - timestamp < RATE_LIMIT.windowMs
  );
  
  if (RATE_LIMIT.queue.length >= RATE_LIMIT.maxRequests) {
    // Calculate delay needed
    const oldestRequest = RATE_LIMIT.queue[0];
    const delayMs = RATE_LIMIT.windowMs - (now - oldestRequest);
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return checkRateLimit();
  }
  
  RATE_LIMIT.queue.push(now);
}

// Helper function to get headers based on whether authentication is required
const getHeaders = (requiresAuth: boolean = false) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (requiresAuth && config.magicEdenApiKey) {
    headers['Authorization'] = `Bearer ${config.magicEdenApiKey}`;
  }
  
  return headers;
};

/**
 * Get trending collections from Magic Eden
 * @param limit - Number of collections to return
 * @param offset - Offset for pagination
 * @param timeRange - Time range for popularity (e.g., '1d', '7d', '30d')
 * @returns Array of trending collections
 */
export async function getTrendingCollections(limit = 20, offset = 0, timeRange: '1d' | '7d' | '30d' = '1d'): Promise<TrendingCollection[]> {
  const cacheKey = `trending-collections-${limit}-${offset}-${timeRange}`;
  
  // Bypass cache for direct API call
  await checkRateLimit();

  console.log('Fetching trending collections from Magic Eden marketplace endpoint');
  const url = `https://api-mainnet.magiceden.dev/v2/marketplace/popular_collections`;
  
  try {
    const response = await axios.get(url);
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log(`Total collections returned: ${response.data.length}`);
      
      // Apply limit and offset
      const paginatedData = response.data.slice(offset, offset + limit);
      
      // Map response to our TrendingCollection type
      const collections = paginatedData.map((item: any) => ({
        symbol: item.symbol,
        name: item.name,
        image: item.image,
        description: item.description || '',
        volume24hr: 0, // Not provided by the API
        volumeAll: item.volumeAll || 0,
        floorPrice: item.floorPrice ? item.floorPrice / 1000000000 : 0 // Convert lamports to SOL
      }));
      
      console.log(`Successfully mapped ${collections.length} collections`);
      return collections;
    } else {
      console.log(`Unexpected API response format: ${JSON.stringify(response.data)}`);
      throw new Error('Invalid response from Magic Eden API');
    }
  } catch (error) {
    console.error(`Error fetching trending collections from Magic Eden marketplace endpoint: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Get floor price for a collection using direct ME API
 * @param collectionIdentifier - Collection symbol or name
 * @returns Floor price information with more accurate data
 */
export async function getFloorPrice(collectionIdentifier: string): Promise<FloorPrice> {
  let symbolToFetch = collectionIdentifier;
  let isLikelySymbol = /^[a-z0-9_]+$/.test(collectionIdentifier) && collectionIdentifier.includes('_');

  if (!isLikelySymbol) {
    console.log(`[MagicEden API] getFloorPrice: collectionIdentifier "${collectionIdentifier}" seems like a name, attempting fuzzy match.`);
    const matchedCollection = await findCollectionByFuzzyName(collectionIdentifier);
    if (matchedCollection && matchedCollection.symbol) {
      symbolToFetch = matchedCollection.symbol;
      console.log(`[MagicEden API] getFloorPrice: Fuzzy match found symbol: "${symbolToFetch}" for name "${collectionIdentifier}".`);
    } else {
      // If fuzzy match fails, we can't proceed to get a floor price for a non-existent/unresolved collection.
      // It might be better to throw an error or return a specific object indicating failure.
      // For now, let's throw, as the original function would fail if the symbol was invalid.
      throw new Error(`[MagicEden API] getFloorPrice: Could not find a collection matching "${collectionIdentifier}" via fuzzy search.`);
    }
  } else {
    console.log(`[MagicEden API] getFloorPrice: collectionIdentifier "${collectionIdentifier}" seems like a symbol, using directly.`);
  }

  console.log(`[MagicEden API] Getting floor price for resolved symbol: ${symbolToFetch}`);
  const cacheKey = `floor-price-${symbolToFetch}`; // Use resolved symbol for cache key
  const cachedData = cache.get<FloorPrice>(cacheKey);
  
  if (cachedData) {
    console.log(`[MagicEden API] Returning cached floor price for ${symbolToFetch}`);
    return cachedData;
  }
  
  await checkRateLimit();
  
  // Fallback to standard API
  try {
    console.log(`[MagicEden API] Trying public API for ${symbolToFetch}`);
    const url = `${BASE_URL}/collections/${symbolToFetch}/stats`;
    const options = {
      headers: getHeaders()
    };
    
    const stats = await fetchData<CollectionStats>(url, options);
    logApiResponse('Public API Stats', stats);
    
    const floorPriceData: FloorPrice = {
      floorPrice: stats.floorPrice ? stats.floorPrice / 1_000_000_000 : null, // Convert from lamports to SOL
      listed: stats.listedCount || 0,
      currency: 'SOL',
      updatedAt: new Date().toISOString()
    };
    
    console.log(`[MagicEden API] Successfully got floor price from public API: ${JSON.stringify(floorPriceData)}`);
    
    // Cache for 1 minute
    cache.set(cacheKey, floorPriceData, 60);
    
    return floorPriceData;
  } catch (error) {
    console.log(`[MagicEden API] Error with public API for ${symbolToFetch}: ${error instanceof Error ? error.message : String(error)}`);
    
    // Return fallback data if all APIs fail
    return {
      floorPrice: null,
      listed: 0,
      currency: 'SOL',
      updatedAt: new Date().toISOString()
    };
  }
}

/**
 * Get collection statistics
 * @param collectionIdentifier - Collection symbol or name
 * @returns Collection statistics
 */
export async function getCollectionStats(collectionIdentifier: string): Promise<CollectionStats> {
  let symbolToFetch = collectionIdentifier;
  let isLikelySymbol = /^[a-z0-9_]+$/.test(collectionIdentifier) && collectionIdentifier.includes('_');

  if (!isLikelySymbol) {
    console.log(`[MagicEden API] collectionIdentifier "${collectionIdentifier}" seems like a name, attempting fuzzy match.`);
    const matchedCollection = await findCollectionByFuzzyName(collectionIdentifier);
    if (matchedCollection && matchedCollection.symbol) {
      symbolToFetch = matchedCollection.symbol;
      console.log(`[MagicEden API] Fuzzy match found symbol: "${symbolToFetch}" for name "${collectionIdentifier}".`);
    } else {
      throw new Error(`[MagicEden API] Could not find a collection matching "${collectionIdentifier}" via fuzzy search.`);
    }
  } else {
    console.log(`[MagicEden API] collectionIdentifier "${collectionIdentifier}" seems like a symbol, using directly.`);
  }

  const cacheKey = `collection-stats-${symbolToFetch}`; // Use the resolved symbol for cache key
  const cachedData = cache.get<CollectionStats>(cacheKey);
  
  if (cachedData) {
    console.log(`[MagicEden API] Returning cached stats for symbol: ${symbolToFetch}`);
    return cachedData;
  }
  
  await checkRateLimit();
  
  // Fallback to standard API
  const url = `${BASE_URL}/collections/${symbolToFetch}/stats`;
  const options = {
    headers: getHeaders()
  };
  
  const stats = await fetchData<CollectionStats>(url, options);
  console.log(`[MagicEden API] Fetched stats for symbol: ${symbolToFetch}`, stats);
  
  // Ensure we have valid data
  const validatedStats: CollectionStats = {
    ...stats,
    volumeAll: stats.volumeAll || 0,
    volume24hr: stats.volume24hr || 0,
    avgPrice24hr: stats.avgPrice24hr || 0,
    floorPrice: stats.floorPrice || 0,
    listedCount: stats.listedCount || 0,
    listedTotalValue: stats.listedTotalValue || 0
  };
  
  // Cache for 1 minute
  cache.set(cacheKey, validatedStats, 60);
  console.log(`[MagicEden API] Cached stats for symbol: ${symbolToFetch}`);
  
  return validatedStats;
}

/**
 * Get listing instruction for an NFT
 * @param params - Listing parameters
 * @returns Listing instruction response
 */
export interface ListingInstructionParams {
  seller: string;
  tokenMint: string;
  tokenAccount: string;
  price: number;
  auctionHouseAddress?: string;
}

export interface ListingInstructionResponse {
  txSigned: boolean;
  tx: string; // Base64 encoded transaction
  txid: string | null;
}

export async function getListingInstruction(params: ListingInstructionParams): Promise<ListingInstructionResponse> {
  if (!config.magicEdenApiKey) {
    throw new Error('Magic Eden API key is required for listing NFTs');
  }

  await checkRateLimit();

  const queryParams = new URLSearchParams({
    seller: params.seller,
    tokenMint: params.tokenMint,
    tokenAccount: params.tokenAccount,
    price: params.price.toString()
  });

  if (params.auctionHouseAddress) {
    queryParams.append('auctionHouseAddress', params.auctionHouseAddress);
  }

  const url = `${BASE_URL}/instructions/sell?${queryParams.toString()}`;
  
  try {
    console.log(`Getting listing instruction for NFT ${params.tokenMint}`);
    const response = await axios.get(url, {
      headers: {
        ...getHeaders(true), // Include API key in headers
        'Authorization': `Bearer ${config.magicEdenApiKey}`
      }
    });

    if (!response.data) {
      throw new Error('No data received from Magic Eden API');
    }

    console.log(`Successfully got listing instruction for NFT ${params.tokenMint}`);
    return {
      txSigned: false,
      tx: response.data.tx,
      txid: null
    };
  } catch (error) {
    console.error(`Error getting listing instruction for NFT ${params.tokenMint}:`, error);
    throw error;
  }
}


/**
 * Get recent activities for a collection
 * @param symbol Collection symbol
 * @param limit Number of activities to return (default 20)
 * @returns Array of collection activities
 */
export async function getCollectionActivities(symbol: string, limit: number = 20): Promise<CollectionActivity[]> {
  console.log(`[MagicEden API] Getting activities for collection: ${symbol}`);
  await checkRateLimit();

  try {
    const url = `${BASE_URL}/collections/${symbol}/activities?offset=0&limit=${limit}`;
    const response = await axios.get<CollectionActivity[]>(url);
    
    // Convert lamports to SOL and sort by most recent
    const activities = response.data.map(activity => ({
      ...activity,
      price: activity.price / 1_000_000_000 // Convert lamports to SOL
    })).sort((a, b) => b.blockTime - a.blockTime);

    console.log(`[MagicEden API] Found ${activities.length} activities for ${symbol}`);
    return activities;
  } catch (error) {
    console.error(`[MagicEden API] Error getting activities for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Get metadata for a specific NFT
 * @param mint NFT mint address
 * @returns NFT metadata
 */
export async function getNFTMetadata(mint: string): Promise<NFTMetadata> {
  console.log(`[MagicEden API] Getting metadata for NFT: ${mint}`);
  await checkRateLimit();

  try {
    const url = `${BASE_URL}/tokens/${mint}`;
    const response = await axios.get<NFTMetadata>(url);
    logApiResponse('NFT Metadata', response.data);
    return response.data;
  } catch (error) {
    console.error(`[MagicEden API] Error getting NFT metadata:`, error);
    throw error;
  }
}

/**
 * Get all NFTs owned by a wallet
 * @param address Wallet address
 * @param limit Number of NFTs to return (default 100)
 * @param offset Offset for pagination
 * @returns Wallet NFTs
 */
export async function getWalletNFTs(address: string, limit: number = 100, offset: number = 0): Promise<WalletNFTs> {
  console.log(`[MagicEden API] Getting NFTs for wallet: ${address}`);
  await checkRateLimit();

  try {
    const url = `${BASE_URL}/wallets/${address}/tokens?limit=${limit}&offset=${offset}`;
    const response = await axios.get<NFTMetadata[]>(url);
    logApiResponse('Wallet NFTs', response.data);

    return {
      tokens: response.data,
      totalItems: response.data.length
    };
  } catch (error) {
    console.error(`[MagicEden API] Error getting wallet NFTs:`, error);
    throw error;
  }
}

/**
 * Finds a collection by a user-provided name using fuzzy matching.
 * @param userInput - The name or partial name of the collection provided by the user.
 * @param similarityThreshold - Maximum Levenshtein distance to consider a match (e.g., 2-3).
 * @returns The matched collection (symbol and name) or null if no suitable match is found.
 */
export async function findCollectionByFuzzyName(
  userInput: string,
  similarityThreshold: number = 3,
  maxPagesToFetch: number = 20 // Safety limit: 20 pages * 500 limit = 10,000 collections
): Promise<BasicCollection | null> {
  console.log(`[MagicEden API] Attempting to find collection for input: "${userInput}"`);
  
  let allCollections: BasicCollection[] | null | undefined = cache.get<BasicCollection[]>(ALL_ME_COLLECTIONS_CACHE_KEY);

  if (allCollections && allCollections.length > 0) { // Check for length too, as empty array could be cached
    console.log(`[MagicEden API] Using cached collection list (${allCollections.length} collections).`);
  } else {
    if (allCollections) { // It means allCollections was an empty array from cache
        console.log('[MagicEden API] Cached collection list was empty. Re-fetching from API...');
    } else {
        console.log(`[MagicEden API] No cached collection list found or cache expired. Fetching from API...`);
    }
    allCollections = []; // Initialize as empty array before fetching
    let currentPage = 0;
    const limit = 500;
    let morePagesExist = true;

    console.log(`[MagicEden API] Fetching collections (up to ${maxPagesToFetch} pages, ${limit} per page)...`);

    while (currentPage < maxPagesToFetch && morePagesExist) {
      await checkRateLimit(); // Check rate limit before each call
      const offset = currentPage * limit;
      const collectionsUrl = `${BASE_URL}/collections?offset=${offset}&limit=${limit}`;
      console.log(`[MagicEden API] Fetching page ${currentPage + 1} from: ${collectionsUrl}`);

      try {
        const response = await axios.get<BasicCollection[]>(collectionsUrl, {
          headers: getHeaders()
        });
        
        const fetchedCollections = response.data;

        if (fetchedCollections && fetchedCollections.length > 0) {
          allCollections.push(...fetchedCollections);
        } else {
          console.log(`[MagicEden API] No collections returned from page ${currentPage + 1}.`);
        }

        if (!fetchedCollections || fetchedCollections.length < limit) {
          morePagesExist = false; 
        }
        currentPage++;
      } catch (pageError) {
        console.error(`[MagicEden API] Error fetching page ${currentPage + 1} for collections:`, pageError);
        morePagesExist = false; 
        if (axios.isAxiosError(pageError) && pageError.response) {
          console.error('[MagicEden API] Page fetch error details:', pageError.response.data);
        }
        if (allCollections.length === 0) {
            console.error('[MagicEden API] Failed to fetch any collections due to an error on the first page.');
            return null;
        }
        break; 
      }
    }

    if (allCollections.length > 0) {
      console.log(`[MagicEden API] Caching ${allCollections.length} collections for ${ALL_ME_COLLECTIONS_CACHE_DURATION_SECONDS} seconds.`);
      cache.set(ALL_ME_COLLECTIONS_CACHE_KEY, allCollections, ALL_ME_COLLECTIONS_CACHE_DURATION_SECONDS);
    } else {
      console.log('[MagicEden API] No collections fetched from API. Cannot proceed with matching.');
      return null; // Explicitly return null if nothing was fetched
    }
  }


  if (!allCollections || allCollections.length === 0) { // Double check, though the else block should handle empty fetches
    console.log('[MagicEden API] No collections available (either from cache or fetch) to perform search.');
    return null;
  }
  console.log(`[MagicEden API] Total collections for matching: ${allCollections.length}`);

  // Prepare lists for fuzzy matching
  const collectionNames = allCollections.map(c => c.name);
  const collectionSymbols = allCollections.map(c => c.symbol);

  // Normalize userInput for better matching
  const normalizedInput = userInput.toLowerCase().replace(/[^a-z0-9]/gi, '');

  let bestMatch: BasicCollection | null = null;
  let minDistance = Infinity;
  let matchType = 'none'; // To track how the match was found: 'full_name', 'symbol', 'prefix_name', 'token_match'

  // 1. Try to find the closest name match (Levenshtein on full normalized name)
  const normalizedCollectionNames = collectionNames.map(name => name.toLowerCase().replace(/[^a-z0-9]/gi, ''));
  const closestFullNameMatch = closest(normalizedInput, normalizedCollectionNames);

  if (closestFullNameMatch) {
    const dist = distance(normalizedInput, closestFullNameMatch);
    if (dist <= similarityThreshold) {
      minDistance = dist;
      bestMatch = allCollections.find(c => c.name.toLowerCase().replace(/[^a-z0-9]/gi, '') === closestFullNameMatch) || null;
      matchType = 'full_name';
    }
  }
  
  // 2. Try to find the closest symbol match (Levenshtein on full normalized symbol)
  // This can override a weak full_name match if the symbol match is better.
  const normalizedCollectionSymbols = collectionSymbols.map(sym => sym.toLowerCase().replace(/[^a-z0-9]/gi, ''));
  const closestSymbolMatch = closest(normalizedInput, normalizedCollectionSymbols);

  if (closestSymbolMatch) {
    const dist = distance(normalizedInput, closestSymbolMatch);
    // If symbol match is better than current bestMatch (or if no bestMatch yet)
    if (dist <= similarityThreshold && dist < minDistance) { 
      minDistance = dist;
      bestMatch = allCollections.find(c => c.symbol.toLowerCase().replace(/[^a-z0-9]/gi, '') === closestSymbolMatch) || null;
      matchType = 'symbol';
    }
  }

  // 3. If no strong match yet, try prefix matching for names
  // This is a secondary check, especially for inputs that are prefixes of longer collection names.
  // We only attempt this if the current bestMatch is weak or non-existent.
  const prefixSimilarityThreshold = 1; // Stricter threshold for prefix part
  // Only trigger prefix if no match, or if existing match is not very strong (e.g. dist > 1 for Levenshtein or symbol)
  if (!bestMatch || minDistance > 1) { 
    for (let i = 0; i < allCollections.length; i++) {
      const collection = allCollections[i];
      const normalizedCollectionName = normalizedCollectionNames[i]; // Use pre-normalized names

      if (normalizedCollectionName.startsWith(normalizedInput)) {
        // Input is a prefix of the collection name.
        // The distance for the prefix part is essentially 0 if it's a direct prefix.
        // We consider this a good match if the user input is substantial enough (e.g., length > 3)
        // And if this prefix match is better than any existing weak match.
        const currentPrefixDist = 0; // Distance is 0 for the prefix part itself
        
        if (userInput.length >= 3 && currentPrefixDist < minDistance) {
           // Check if this prefix match is better than any previous weak Levenshtein match
          const levenshteinDistForPrefixOnly = distance(normalizedInput, normalizedCollectionName.substring(0, normalizedInput.length));
          if (levenshteinDistForPrefixOnly <= prefixSimilarityThreshold && levenshteinDistForPrefixOnly < minDistance) {
            minDistance = levenshteinDistForPrefixOnly; // Or assign a conceptual distance like 0.5 to prioritize full matches slightly
            bestMatch = collection;
            matchType = 'prefix_name';
            // If we found a perfect prefix match, we might want to break or continue to find the shortest full name that has this prefix
            // For now, first good prefix match is taken if it improves over prior matches
          }
        }
      }
    }
  }

  // 4. If still no strong match, try token-based matching for names.
  // This is for cases like "OddKey POAP" vs "OddKey Cover POAPs NFT".
  // Trigger if no match, or if existing match is still not very strong (e.g. minDistance > 1 after prefix check)
  const tokenMatchMaxCumulativeDistance = 2; // Max cumulative Levenshtein distance for all user tokens
  const singleTokenMaxDist = 2; // Max distance for an individual token to be considered a match

  if (!bestMatch || minDistance > 1) {
    // Tokenize user input: lowercase, split by non-alphanumeric, then normalize each token
    const rawUserInputTokens = userInput.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 0);
    const userInputTokens = rawUserInputTokens.map(token => token.replace(/[^a-z0-9]/gi, ''));

    if (userInputTokens.length > 0) {
      for (let i = 0; i < allCollections.length; i++) {
        const collection = allCollections[i];
        // Tokenize collection name: lowercase, split by non-alphanumeric, then normalize each token
        const rawCollectionNameTokens = collection.name.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 0);
        const collectionNameTokens = rawCollectionNameTokens.map(token => token.replace(/[^a-z0-9]/gi, ''));

        if (collectionNameTokens.length === 0) continue;

        let currentCollectionCumulativeTokenDistance = 0;
        let matchedTokensCount = 0;

        for (const userToken of userInputTokens) {
          const closestTokenInCollection = closest(userToken, collectionNameTokens);
          if (closestTokenInCollection) {
            const dist = distance(userToken, closestTokenInCollection);
            if (dist <= singleTokenMaxDist) { 
              currentCollectionCumulativeTokenDistance += dist;
              matchedTokensCount++;
            } else {
              // Penalize if closest token is too far
              currentCollectionCumulativeTokenDistance += singleTokenMaxDist + 1; 
            }
          } else {
            // Penalize if no token is found (should not happen if collectionNameTokens is not empty and closest works)
            currentCollectionCumulativeTokenDistance += singleTokenMaxDist + 1; 
          }
        }
        
        // Consider a match if a good percentage of user tokens matched (e.g., all of them)
        // and cumulative distance is low and better than current bestMatch.
        const requiredMatches = userInputTokens.length; // Require all user tokens to match for now

        if (matchedTokensCount >= requiredMatches && 
            currentCollectionCumulativeTokenDistance <= tokenMatchMaxCumulativeDistance &&
            currentCollectionCumulativeTokenDistance < minDistance) {
              minDistance = currentCollectionCumulativeTokenDistance; 
              bestMatch = collection;
              matchType = 'token_match';
        }
      }
    }
  }

  if (bestMatch) {
    console.log(`[MagicEden API] Found potential match for "${userInput}": Name: "${bestMatch.name}", Symbol: "${bestMatch.symbol}" with score/distance ${minDistance} (Type: ${matchType})`);
    return { name: bestMatch.name, symbol: bestMatch.symbol, image: bestMatch.image, description: bestMatch.description };
  } else {
    console.log(`[MagicEden API] No sufficiently close match found for "${userInput}" with threshold ${similarityThreshold}.`);
    return null;
  }
} 