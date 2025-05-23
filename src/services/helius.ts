import { fetchData } from '../utils/fetch';
import { cache } from '../utils/cache';
import { config } from '../config/env';
import axios from 'axios';

// Types
interface NFTMetadata {
  mint: string;
  name: string;
  symbol: string;
  image: string;
  collection?: {
    name: string;
    family: string;
  };
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  rarity?: {
    rank: number;
    score: number;
    totalSupply: number;
  };
  owner: string;
  tokenAccount: string;
  updateAuthority: string;
  sellerFeeBasisPoints: number;
  primarySaleHappened: boolean;
  lastSale?: {
    price: number;
    signature: string;
    date: string;
  };
}

interface WalletNFTs {
  address: string;
  tokens: NFTMetadata[];
}

// Base URL for Helius API
const BASE_URL = 'https://api.helius.xyz/v0';
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${config.heliusApiKey}`;

/**
 * Get NFT metadata by mint address using getAsset RPC method
 * @param mint - NFT mint address
 * @returns NFT metadata
 */
export async function getNFTMetadata(mint: string): Promise<NFTMetadata> {
  const cacheKey = `nft-metadata-${mint}`;
  const cachedData = cache.get<NFTMetadata>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    console.log(`Fetching metadata for NFT ${mint} using getAsset RPC method`);
    
    const response = await axios.post(HELIUS_RPC_URL, {
      jsonrpc: "2.0",
      id: "my-id",
      method: "getAsset",
      params: {
        id: mint
      }
    });
    
    if (response.data && response.data.result) {
      const asset = response.data.result;
      console.log(`Successfully fetched metadata for NFT ${mint}`);
      
      // Map the RPC response to our NFTMetadata type
      const metadata: NFTMetadata = {
        mint: asset.id,
        name: asset.content?.metadata?.name || 'Unknown',
        symbol: asset.content?.metadata?.symbol || '',
        image: asset.content?.files?.[0]?.uri || asset.content?.metadata?.image || '',
        collection: {
          name: asset.content?.metadata?.collection?.name || 
                asset.content?.metadata?.collection_metadata?.name ||
                asset.grouping?.find((g: any) => g.group_key === 'collection')?.group_value || 
                'Unknown Collection',
          family: asset.content?.metadata?.collection?.family || 
                 asset.grouping?.find((g: any) => g.group_key === 'collection')?.group_value || 
                 ''
        },
        attributes: asset.content?.metadata?.attributes,
        owner: asset.ownership?.owner || '',
        tokenAccount: asset.ownership?.tokenAccount || '',
        updateAuthority: asset.authorities?.[0]?.address || '',
        sellerFeeBasisPoints: asset.royalty?.basis_points || 0,
        primarySaleHappened: asset.royalty?.primary_sale_happened || false
      };
      
      // Cache for 5 minutes
      cache.set(cacheKey, metadata, 300);
      
      return metadata;
    } else {
      throw new Error(`Invalid response for NFT ${mint}`);
    }
  } catch (error) {
    console.error(`Error fetching metadata for NFT ${mint}:`, error);
    
    // Fallback to old method as a backup
    try {
      console.log(`Falling back to REST API for NFT ${mint}`);
      const url = `${BASE_URL}/tokens/metadata?api-key=${config.heliusApiKey}`;
      
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
      
      const response = await fetchData<NFTMetadata[]>(url, options);
      
      if (!response.length) {
        throw new Error(`NFT with mint address ${mint} not found`);
      }
      
      // Cache for 5 minutes
      cache.set(cacheKey, response[0], 300);
      
      return response[0];
    } catch (fallbackError) {
      console.error(`Fallback method also failed for NFT ${mint}:`, fallbackError);
      throw error; // Throw the original error
    }
  }
}

/**
 * Get all NFTs owned by a wallet
 * @param address - Wallet address
 * @returns Wallet NFTs
 */
export async function getWalletNFTs(address: string): Promise<WalletNFTs> {
  const cacheKey = `wallet-nfts-${address}`;
  const cachedData = cache.get<WalletNFTs>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Method 1: Using direct RPC call (most reliable)
    console.log(`Fetching NFTs for wallet ${address} using Helius RPC API`);
    const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${config.heliusApiKey}`;
    
    const response = await axios.post(rpcUrl, {
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
      
      const nfts = response.data.result.items.map((item: any) => {
        return {
          mint: item.id,
          name: item.content.metadata.name || 'Unknown',
          symbol: item.content.metadata.symbol || '',
          image: item.content.files?.[0]?.uri || item.content.metadata.image || '',
          collection: item.grouping?.find((g: any) => g.group_key === 'collection')?.group_value 
            ? {
                name: item.grouping.find((g: any) => g.group_key === 'collection')?.group_value,
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
      
      const result: WalletNFTs = {
        address,
        tokens: nfts
      };
      
      // Cache for 2 minutes
      cache.set(cacheKey, result, 120);
      
      return result;
    }
    
    // If no results from RPC method, throw to try the REST API
    throw new Error('No NFTs found via RPC method');
  } catch (error) {
    console.log(`RPC method failed, falling back to REST API: ${error instanceof Error ? error.message : String(error)}`);
    
    try {
      // Method 2: Using REST API (fallback)
      const url = `${BASE_URL}/addresses/${address}/nfts?api-key=${config.heliusApiKey}`;
      
      console.log(`Fetching NFTs for wallet ${address} using Helius REST API`);
      const response = await axios.get(url);
      
      if (response.data) {
        console.log(`Found ${response.data.length} NFTs using REST API method`);
        
        const result: WalletNFTs = {
          address,
          tokens: response.data
        };
        
        // Cache for 2 minutes
        cache.set(cacheKey, result, 120);
        
        return result;
      }
      
      // If we get here, both methods failed but didn't throw, return empty array
      return {
        address,
        tokens: []
      };
    } catch (finalError) {
      console.error(`All methods failed to fetch NFTs for wallet ${address}:`, finalError);
      
      // Return empty array instead of failing
      return {
        address,
        tokens: []
      };
    }
  }
} 