"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNFTMetadata = getNFTMetadata;
exports.getWalletNFTs = getWalletNFTs;
const fetch_1 = require("../utils/fetch");
const cache_1 = require("../utils/cache");
const env_1 = require("../config/env");
const axios_1 = __importDefault(require("axios"));
// Base URL for Helius API
const BASE_URL = 'https://api.helius.xyz/v0';
/**
 * Get NFT metadata by mint address
 * @param mint - NFT mint address
 * @returns NFT metadata
 */
async function getNFTMetadata(mint) {
    const cacheKey = `nft-metadata-${mint}`;
    const cachedData = cache_1.cache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    const url = `${BASE_URL}/tokens/metadata?api-key=${env_1.config.heliusApiKey}`;
    try {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                mintAccounts: [mint],
                includeOffChain: true,
                disableCache: false
            }
        };
        const response = await (0, fetch_1.fetchData)(url, options);
        if (!response.length) {
            throw new Error(`NFT with mint address ${mint} not found`);
        }
        // Cache for 5 minutes
        cache_1.cache.set(cacheKey, response[0], 300);
        return response[0];
    }
    catch (error) {
        console.error(`Error fetching metadata for NFT ${mint}:`, error);
        throw error;
    }
}
/**
 * Get all NFTs owned by a wallet
 * @param address - Wallet address
 * @returns Wallet NFTs
 */
async function getWalletNFTs(address) {
    const cacheKey = `wallet-nfts-${address}`;
    const cachedData = cache_1.cache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    try {
        // Method 1: Using direct RPC call (most reliable)
        console.log(`Fetching NFTs for wallet ${address} using Helius RPC API`);
        const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${env_1.config.heliusApiKey}`;
        const response = await axios_1.default.post(rpcUrl, {
            jsonrpc: "2.0",
            id: "my-id",
            method: "getAssetsByOwner",
            params: {
                ownerAddress: address,
                page: 1,
                limit: 100
            }
        });
        if (response.data && response.data.result && response.data.result.items) {
            console.log(`Found ${response.data.result.items.length} NFTs using RPC method`);
            const nfts = response.data.result.items.map((item) => {
                return {
                    mint: item.id,
                    name: item.content.metadata.name || 'Unknown',
                    symbol: item.content.metadata.symbol || '',
                    image: item.content.files?.[0]?.uri || item.content.metadata.image || '',
                    collection: item.grouping?.find((g) => g.group_key === 'collection')?.group_value
                        ? {
                            name: item.grouping.find((g) => g.group_key === 'collection')?.group_value,
                            family: ''
                        }
                        : undefined,
                    attributes: item.content.metadata.attributes,
                    owner: address,
                    tokenAccount: item.token_info?.token_account || '',
                    updateAuthority: item.authorities?.[0]?.address || '',
                    sellerFeeBasisPoints: item.royalty?.basis_points || 0,
                    primarySaleHappened: item.royalty?.primary_sale_happened || false
                };
            });
            const result = {
                address,
                tokens: nfts
            };
            // Cache for 2 minutes
            cache_1.cache.set(cacheKey, result, 120);
            return result;
        }
        // If no results from RPC method, throw to try the REST API
        throw new Error('No NFTs found via RPC method');
    }
    catch (error) {
        console.log(`RPC method failed, falling back to REST API: ${error instanceof Error ? error.message : String(error)}`);
        try {
            // Method 2: Using REST API (fallback)
            const url = `${BASE_URL}/addresses/${address}/nfts?api-key=${env_1.config.heliusApiKey}`;
            console.log(`Fetching NFTs for wallet ${address} using Helius REST API`);
            const response = await axios_1.default.get(url);
            if (response.data) {
                console.log(`Found ${response.data.length} NFTs using REST API method`);
                const result = {
                    address,
                    tokens: response.data
                };
                // Cache for 2 minutes
                cache_1.cache.set(cacheKey, result, 120);
                return result;
            }
            // If we get here, both methods failed but didn't throw, return empty array
            return {
                address,
                tokens: []
            };
        }
        catch (finalError) {
            console.error(`All methods failed to fetch NFTs for wallet ${address}:`, finalError);
            // Return empty array instead of failing
            return {
                address,
                tokens: []
            };
        }
    }
}
