import { fetchData } from '../utils/fetch';
import { cache } from '../utils/cache';
import { config } from '../config/env';
import axios from 'axios';

// Types
interface Collection {
  symbol: string;
  name: string;
  image: string;
  description?: string;
  twitter?: string;
  discord?: string;
  website?: string;
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

// Base URL for Magic Eden API
const BASE_URL = 'https://api-mainnet.magiceden.dev/v2';

// Magic Eden's internal API used by their frontend
const ME_INTERNAL_API = 'https://api-mainnet.magiceden.io/v2';

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 10, // Maximum requests per window
  windowMs: 1000, // Time window in milliseconds (1 second)
  queue: [] as number[] // Queue to track request timestamps
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
 * @param symbol - Collection symbol
 * @returns Floor price information with more accurate data
 */
export async function getFloorPrice(symbol: string): Promise<FloorPrice> {
  const cacheKey = `floor-price-${symbol}`;
  const cachedData = cache.get<FloorPrice>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  await checkRateLimit();
  
  try {
    // Try the internal frontend API first
    const response = await axios.get(`${ME_INTERNAL_API}/collections/${symbol}/stats`);
    
    if (response.data) {
      console.log('Raw ME internal API response:', JSON.stringify(response.data, null, 2));
      
      const floorPriceData: FloorPrice = {
        floorPrice: response.data.floorPrice ? response.data.floorPrice / 1000000000 : null,
        listed: response.data.listedCount || 0,
        currency: 'SOL',
        updatedAt: new Date().toISOString()
      };
      
      // Cache for 1 minute
      cache.set(cacheKey, floorPriceData, 60);
      
      return floorPriceData;
    }
  } catch (error) {
    console.log(`Error with ME internal API for ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Let's try the alternative direct API
  try {
    const response = await axios.post('https://api-mainnet.magiceden.io/rpc/getCollectionEscrowStats', { symbol });
    
    if (response.data && response.data.results) {
      console.log('Raw ME RPC API response:', JSON.stringify(response.data, null, 2));
      
      const results = response.data.results;
      
      const floorPriceData: FloorPrice = {
        floorPrice: results.floorPrice ? results.floorPrice / 1000000000 : null,
        listed: results.listedCount || 0,
        currency: 'SOL',
        updatedAt: new Date().toISOString()
      };
      
      // Cache for 1 minute
      cache.set(cacheKey, floorPriceData, 60);
      
      return floorPriceData;
    }
  } catch (error) {
    console.log(`Error with ME RPC API for ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Fallback to standard API
  try {
    const url = `${BASE_URL}/collections/${symbol}/stats`;
    const options = {
      headers: getHeaders()
    };
    
    const stats = await fetchData<CollectionStats>(url, options);
    console.log('Raw ME public API response:', JSON.stringify(stats, null, 2));
    
    const floorPriceData: FloorPrice = {
      floorPrice: stats.floorPrice ? stats.floorPrice / 1000000000 : null,
      listed: stats.listedCount || 0,
      currency: 'SOL',
      updatedAt: new Date().toISOString()
    };
    
    // Cache for 1 minute
    cache.set(cacheKey, floorPriceData, 60);
    
    return floorPriceData;
  } catch (error) {
    console.log(`Error with ME public API for ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
    
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
 * @param symbol - Collection symbol
 * @returns Collection statistics
 */
export async function getCollectionStats(symbol: string): Promise<CollectionStats> {
  const cacheKey = `collection-stats-${symbol}`;
  const cachedData = cache.get<CollectionStats>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  await checkRateLimit();
  
  try {
    // First try the direct API which has more accurate data
    const response = await axios.post('https://api-mainnet.magiceden.io/rpc/getCollectionEscrowStats', { symbol });
    
    if (response.data && response.data.results) {
      const results = response.data.results;
      
      const stats: CollectionStats = {
        symbol,
        volumeAll: results.volume?.allTime / 1000000000 || 0,
        volume24hr: results.volume?.h24 / 1000000000 || 0,
        avgPrice24hr: results.avgPrice24hr / 1000000000 || 0,
        floorPrice: results.floorPrice / 1000000000 || 0,
        listedCount: results.listedCount || 0,
        listedTotalValue: results.listedTotalValue / 1000000000 || 0
      };
      
      // Cache for 1 minute
      cache.set(cacheKey, stats, 60);
      
      return stats;
    }
  } catch (error) {
    console.log(`Error with direct ME API for ${symbol}, falling back to standard API`);
  }
  
  // Fallback to standard API
  const url = `${BASE_URL}/collections/${symbol}/stats`;
  const options = {
    headers: getHeaders()
  };
  
  const stats = await fetchData<CollectionStats>(url, options);
  
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
 * List an NFT for sale (DEPRECATED - Use getListingInstruction instead)
 * @deprecated Use getListingInstruction instead which returns the transaction for wallet signing
 */
export async function listNft(mint: string, price: number, sellerWallet: string): Promise<{ transactionId: string }> {
  console.warn('Warning: listNft is deprecated. Use getListingInstruction instead.');
  if (!config.magicEdenApiKey) {
    throw new Error('Magic Eden API key is required for listing NFTs');
  }

  await checkRateLimit();

  const url = `${BASE_URL}/nfts/list`;
  const options = {
    method: 'POST',
    headers: getHeaders(true),
    data: {
      mint,
      price,
      sellerWallet
    }
  };
  
  return await fetchData<{ transactionId: string }>(url, options);
}

/**
 * Delist an NFT from sale
 * @param mint - NFT mint address
 * @param sellerWallet - Seller wallet address
 * @returns Transaction ID
 * @throws Error if Magic Eden API key is not configured
 */
export async function delistNft(mint: string, sellerWallet: string): Promise<{ transactionId: string }> {
  if (!config.magicEdenApiKey) {
    throw new Error('Magic Eden API key is required for delisting NFTs');
  }

  await checkRateLimit();

  const url = `${BASE_URL}/nfts/delist`;
  const options = {
    method: 'POST',
    headers: getHeaders(true),
    data: {
      mint,
      sellerWallet
    }
  };
  
  return await fetchData<{ transactionId: string }>(url, options);
} 