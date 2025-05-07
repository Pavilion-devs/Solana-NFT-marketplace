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
 * @returns Array of trending collections
 */
async function getTrendingCollections(limit = 20, offset = 0) {
    const cacheKey = `trending-collections-${limit}-${offset}`;
    const cachedData = cache_1.cache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    await checkRateLimit();
    // List of popular collections to use as fallback
    const popularCollections = [
        { symbol: 'okay_bears', name: 'Okay Bears', image: 'https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://bafybeigpgmeklembgujmes5j7w5oqcbv4zxu5db45zl4cxggobnme7pz2m.ipfs.dweb.link/' },
        { symbol: 'y00ts', name: 'y00ts', image: 'https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://bafkreiguzmgbld3ueduiqkjf5bj7i4dkgbrl3bna6ljrvhpqshwp2nsvk4.ipfs.dweb.link/' },
        { symbol: 'degods', name: 'DeGods', image: 'https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://metadata.degods.com/g/4924.png' },
        { symbol: 'primates', name: 'Primates', image: 'https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://dl.airtable.com/.attachmentThumbnails/f8651fcd1f8f2ae5996a1913d57be2a3/c7945b8e' },
        { symbol: 'shadowysupercoder', name: 'Shadowy Super Coder', image: 'https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://arweave.net/ICUq9Erve1RYyYiS6jUEKBiUVVKev_MTtgVDuhNUzs8' },
        { symbol: 'abc', name: 'ABC Collection', image: 'https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://arweave.net/XexXej0Y1a0TcEZBTZbJEFY_WWuQ1dfxLUGJKc8-V34' },
        { symbol: 'froots', name: 'Froots', image: 'https://bafybeifnx5y2gxf3wlgygbjy2wm6p2vjh5t2oms43prgzjmji2ckkbrrwe.ipfs.dweb.link/4588.png' },
        { symbol: 'claynosaurz', name: 'Claynosaurz', image: 'https://bafybeih7z6kfghuzmgwvqmjudiwas6f4nzp442yckgafm5ht3ckmfvr5oi.ipfs.dweb.link/' },
        { symbol: 'famous_fox_federation', name: 'Famous Fox Federation', image: 'https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://dl.airtable.com/.attachmentThumbnails/cb8feff57e818a2caf178d734bea6ccc/97f384e2' },
        { symbol: 'Blocksmith_Labs_Genesis', name: 'Blocksmith Labs', image: 'https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://arweave.net/uQVBSjVF-AuB8XiTCbRKdKgop6ywIVYNlIujRBHDXx8' }
    ];
    try {
        // First try the more reliable API (Tensor)
        console.log('Fetching trending collections from alternative API');
        const tensorResponse = await axios_1.default.get('https://api.tensor.so/api/collections/top?timeRange=1d&sortBy=volume');
        if (tensorResponse.data && tensorResponse.data.collections?.length > 0) {
            console.log(`Found ${tensorResponse.data.collections.length} trending collections from alternative API`);
            // Map Tensor collections to our format
            const collections = tensorResponse.data.collections.slice(offset, offset + limit).map((item) => {
                return {
                    symbol: item.slug,
                    name: item.name,
                    image: item.imageUri,
                    volume24hr: item.volume1d || 0,
                    volumeAll: item.volumeAll || 0
                };
            });
            // Cache for 15 minutes
            cache_1.cache.set(cacheKey, collections, 900);
            return collections;
        }
    }
    catch (error) {
        console.log(`Error fetching trending collections from alternative API: ${error instanceof Error ? error.message : String(error)}`);
    }
    try {
        // Try Magic Eden's internal API
        console.log('Fetching trending collections from ME internal API');
        const internalResponse = await axios_1.default.get(`${ME_INTERNAL_API}/collections/popular?limit=${limit}&offset=${offset}`);
        if (internalResponse.data && internalResponse.data.length > 0) {
            console.log(`Found ${internalResponse.data.length} trending collections from ME internal API`);
            // Cache for 5 minutes
            cache_1.cache.set(cacheKey, internalResponse.data, 300);
            return internalResponse.data;
        }
    }
    catch (error) {
        console.log(`Error fetching trending collections from ME internal API: ${error instanceof Error ? error.message : String(error)}`);
    }
    try {
        // Fallback to public API
        console.log('Fetching trending collections from ME public API');
        const url = `${BASE_URL}/collections/popular`;
        const options = {
            params: { limit, offset },
            headers: getHeaders()
        };
        const collections = await (0, fetch_1.fetchData)(url, options);
        if (collections && collections.length > 0) {
            console.log(`Found ${collections.length} trending collections from ME public API`);
            // Cache for 5 minutes
            cache_1.cache.set(cacheKey, collections, 300);
            return collections;
        }
    }
    catch (error) {
        console.log(`Error fetching trending collections from ME public API: ${error instanceof Error ? error.message : String(error)}`);
    }
    // If all APIs fail, return fallback collection data
    console.log('All APIs failed, returning fallback collection data');
    // Transform popular collections to trending collections with some mock data
    const fallbackCollections = popularCollections.slice(0, limit).map(collection => ({
        ...collection,
        volume24hr: Math.floor(Math.random() * 1000) / 10, // Random volume between 0-100
        volumeAll: Math.floor(Math.random() * 10000) / 10, // Random total volume
        description: `${collection.name} on Solana`,
        twitter: `https://twitter.com/${collection.symbol}`,
        discord: `https://discord.gg/${collection.symbol}`
    }));
    // Cache for 5 minutes
    cache_1.cache.set(cacheKey, fallbackCollections, 300);
    return fallbackCollections;
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
