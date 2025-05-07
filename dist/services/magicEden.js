"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrendingCollections = getTrendingCollections;
exports.getFloorPrice = getFloorPrice;
exports.getCollectionStats = getCollectionStats;
exports.listNft = listNft;
exports.delistNft = delistNft;
const fetch_1 = require("../utils/fetch");
const cache_1 = require("../utils/cache");
const env_1 = require("../config/env");
const axios_1 = __importDefault(require("axios"));
// Base URL for Magic Eden API
const BASE_URL = 'https://api-mainnet.magiceden.dev/v2';
// Magic Eden's internal API used by their frontend
const ME_INTERNAL_API = 'https://api-mainnet.magiceden.io/v2';
// Rate limiting configuration
const RATE_LIMIT = {
    maxRequests: 10, // Maximum requests per window
    windowMs: 1000, // Time window in milliseconds (1 second)
    queue: [] // Queue to track request timestamps
};
/**
 * Check and update rate limit queue
 * Returns a promise that resolves when it's safe to make a request
 */
async function checkRateLimit() {
    const now = Date.now();
    // Remove timestamps older than the window
    RATE_LIMIT.queue = RATE_LIMIT.queue.filter(timestamp => now - timestamp < RATE_LIMIT.windowMs);
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
const getHeaders = (requiresAuth = false) => {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (requiresAuth && env_1.config.magicEdenApiKey) {
        headers['Authorization'] = `Bearer ${env_1.config.magicEdenApiKey}`;
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
async function getTrendingCollections(limit = 20, offset = 0, timeRange = '1d') {
    const cacheKey = `trending-collections-${limit}-${offset}-${timeRange}`;
    const cachedData = cache_1.cache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    await checkRateLimit();
    try {
        console.log('Fetching trending collections from Magic Eden API...');
        const url = `${BASE_URL}/marketplace/popular_collections`;
        const response = await axios_1.default.get(url);
        if (response.data && Array.isArray(response.data)) {
            console.log(`Successfully fetched ${response.data.length} collections`);
            const collections = response.data.map((item) => ({
                symbol: item.symbol,
                name: item.name,
                image: item.image,
                description: item.description,
                volume24hr: 0, // This endpoint doesn't provide 24h volume
                volumeAll: item.volumeAll || 0,
                floorPrice: item.floorPrice ? item.floorPrice / 1e9 : null,
                hasCNFTs: item.hasCNFTs || false
            }));
            // Apply limit and offset
            const paginatedCollections = collections.slice(offset, offset + limit);
            cache_1.cache.set(cacheKey, paginatedCollections, 300); // Cache for 5 minutes
            return paginatedCollections;
        }
        throw new Error('Invalid response format from Magic Eden API');
    }
    catch (error) {
        console.error('Error fetching trending collections:', error instanceof Error ? error.message : String(error));
        throw error;
    }
}
/**
 * Get floor price for a collection using direct ME API
 * @param symbol - Collection symbol
 * @returns Floor price information with more accurate data
 */
async function getFloorPrice(symbol) {
    const cacheKey = `floor-price-${symbol}`;
    const cachedData = cache_1.cache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    await checkRateLimit();
    try {
        // Try the internal frontend API first
        const response = await axios_1.default.get(`${ME_INTERNAL_API}/collections/${symbol}/stats`);
        if (response.data) {
            console.log('Raw ME internal API response:', JSON.stringify(response.data, null, 2));
            const floorPriceData = {
                floorPrice: response.data.floorPrice ? response.data.floorPrice / 1000000000 : null,
                listed: response.data.listedCount || 0,
                currency: 'SOL',
                updatedAt: new Date().toISOString()
            };
            // Cache for 1 minute
            cache_1.cache.set(cacheKey, floorPriceData, 60);
            return floorPriceData;
        }
    }
    catch (error) {
        console.log(`Error with ME internal API for ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
    }
    // Let's try the alternative direct API
    try {
        const response = await axios_1.default.post('https://api-mainnet.magiceden.io/rpc/getCollectionEscrowStats', { symbol });
        if (response.data && response.data.results) {
            console.log('Raw ME RPC API response:', JSON.stringify(response.data, null, 2));
            const results = response.data.results;
            const floorPriceData = {
                floorPrice: results.floorPrice ? results.floorPrice / 1000000000 : null,
                listed: results.listedCount || 0,
                currency: 'SOL',
                updatedAt: new Date().toISOString()
            };
            // Cache for 1 minute
            cache_1.cache.set(cacheKey, floorPriceData, 60);
            return floorPriceData;
        }
    }
    catch (error) {
        console.log(`Error with ME RPC API for ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
    }
    // Fallback to standard API
    try {
        const url = `${BASE_URL}/collections/${symbol}/stats`;
        const options = {
            headers: getHeaders()
        };
        const stats = await (0, fetch_1.fetchData)(url, options);
        console.log('Raw ME public API response:', JSON.stringify(stats, null, 2));
        const floorPriceData = {
            floorPrice: stats.floorPrice ? stats.floorPrice / 1000000000 : null,
            listed: stats.listedCount || 0,
            currency: 'SOL',
            updatedAt: new Date().toISOString()
        };
        // Cache for 1 minute
        cache_1.cache.set(cacheKey, floorPriceData, 60);
        return floorPriceData;
    }
    catch (error) {
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
async function getCollectionStats(symbol) {
    const cacheKey = `collection-stats-${symbol}`;
    const cachedData = cache_1.cache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    await checkRateLimit();
    try {
        // First try the direct API which has more accurate data
        const response = await axios_1.default.post('https://api-mainnet.magiceden.io/rpc/getCollectionEscrowStats', { symbol });
        if (response.data && response.data.results) {
            const results = response.data.results;
            const stats = {
                symbol,
                volumeAll: results.volume?.allTime / 1000000000 || 0,
                volume24hr: results.volume?.h24 / 1000000000 || 0,
                avgPrice24hr: results.avgPrice24hr / 1000000000 || 0,
                floorPrice: results.floorPrice / 1000000000 || 0,
                listedCount: results.listedCount || 0,
                listedTotalValue: results.listedTotalValue / 1000000000 || 0
            };
            // Cache for 1 minute
            cache_1.cache.set(cacheKey, stats, 60);
            return stats;
        }
    }
    catch (error) {
        console.log(`Error with direct ME API for ${symbol}, falling back to standard API`);
    }
    // Fallback to standard API
    const url = `${BASE_URL}/collections/${symbol}/stats`;
    const options = {
        headers: getHeaders()
    };
    const stats = await (0, fetch_1.fetchData)(url, options);
    // Ensure we have valid data
    const validatedStats = {
        ...stats,
        volumeAll: stats.volumeAll || 0,
        volume24hr: stats.volume24hr || 0,
        avgPrice24hr: stats.avgPrice24hr || 0,
        floorPrice: stats.floorPrice || 0,
        listedCount: stats.listedCount || 0,
        listedTotalValue: stats.listedTotalValue || 0
    };
    // Cache for 1 minute
    cache_1.cache.set(cacheKey, validatedStats, 60);
    return validatedStats;
}
/**
 * List an NFT for sale
 * @param mint - NFT mint address
 * @param price - Listing price in SOL
 * @param sellerWallet - Seller wallet address
 * @returns Transaction ID
 * @throws Error if Magic Eden API key is not configured
 */
async function listNft(mint, price, sellerWallet) {
    if (!env_1.config.magicEdenApiKey) {
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
    return await (0, fetch_1.fetchData)(url, options);
}
/**
 * Delist an NFT from sale
 * @param mint - NFT mint address
 * @param sellerWallet - Seller wallet address
 * @returns Transaction ID
 * @throws Error if Magic Eden API key is not configured
 */
async function delistNft(mint, sellerWallet) {
    if (!env_1.config.magicEdenApiKey) {
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
    return await (0, fetch_1.fetchData)(url, options);
}
