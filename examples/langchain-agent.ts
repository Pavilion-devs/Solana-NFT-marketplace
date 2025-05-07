import { Tool } from "langchain/tools";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { SystemMessage, HumanMessage } from "langchain/schema";

/**
 * Example of how to use the Solana NFT MCP API with LangChain
 * This creates an AI agent that can interact with the Solana NFT ecosystem
 */

// Base URL for the MCP API
const MCP_API_URL = "http://localhost:3000";

// Create tools for the agent
const getTrendingCollectionsTool = new Tool({
  name: "get_trending_collections",
  description: "Get trending NFT collections on Solana",
  func: async () => {
    const response = await fetch(`${MCP_API_URL}/collections/trending`);
    const data = await response.json();
    return JSON.stringify(data);
  }
});

const getFloorPriceTool = new Tool({
  name: "get_floor_price",
  description: "Gets floor price of an NFT collection on Solana. Input should be the collection symbol (e.g. 'madlads')",
  func: async (collectionSymbol: string) => {
    const response = await fetch(`${MCP_API_URL}/collections/${collectionSymbol}/floor-price`);
    const data = await response.json();
    return JSON.stringify(data);
  }
});

const getCollectionStatsTool = new Tool({
  name: "get_collection_stats",
  description: "Gets statistics for an NFT collection on Solana. Input should be the collection symbol (e.g. 'madlads')",
  func: async (collectionSymbol: string) => {
    const response = await fetch(`${MCP_API_URL}/collections/${collectionSymbol}/stats`);
    const data = await response.json();
    return JSON.stringify(data);
  }
});

const getWalletNFTsTool = new Tool({
  name: "get_wallet_nfts",
  description: "Gets all NFTs in a Solana wallet. Input should be the wallet address",
  func: async (walletAddress: string) => {
    const response = await fetch(`${MCP_API_URL}/wallet/${walletAddress}/nfts`);
    const data = await response.json();
    return JSON.stringify(data);
  }
});

const getNFTMetadataTool = new Tool({
  name: "get_nft_metadata",
  description: "Gets metadata for a specific NFT. Input should be the NFT mint address",
  func: async (mintAddress: string) => {
    const response = await fetch(`${MCP_API_URL}/nft/${mintAddress}/metadata`);
    const data = await response.json();
    return JSON.stringify(data);
  }
});

// Setup agent with OpenAI
async function runAgent() {
  // Initialize LLM with your OpenAI API key
  const llm = new ChatOpenAI({
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
  
  // Define tools for the agent
  const tools = [
    getTrendingCollectionsTool,
    getFloorPriceTool,
    getCollectionStatsTool,
    getWalletNFTsTool,
    getNFTMetadataTool
  ];
  
  // Create system prompt for the agent
  const systemPrompt = new SystemMessage(`You are a helpful assistant that can analyze and interact with Solana NFTs.
You have access to the following tools:
- get_trending_collections: See what NFT collections are trending on Solana
- get_floor_price: Check the floor price of a collection
- get_collection_stats: Get detailed statistics about a collection
- get_wallet_nfts: View all NFTs in a wallet
- get_nft_metadata: Get metadata and traits for a specific NFT

When asked about NFTs, collections, or wallets, use the appropriate tool to get information.
Return the information in a clear, concise way, focusing on what the user is asking about.`);
  
  // Create agent
  const agent = await createOpenAIFunctionsAgent({
    llm,
    tools,
    systemMessage: systemPrompt
  });
  
  // Create agent executor
  const agentExecutor = AgentExecutor.fromAgentAndTools({
    agent,
    tools,
    verbose: true
  });
  
  console.log("Agent created. Ready to answer questions about Solana NFTs!");
  
  // Example query 1: Get trending collections
  const result1 = await agentExecutor.invoke({
    input: "What are the trending NFT collections on Solana right now?"
  });
  console.log("Result 1:", result1.output);
  
  // Example query 2: Get floor price
  const result2 = await agentExecutor.invoke({
    input: "What's the floor price of the MadLads collection?"
  });
  console.log("Result 2:", result2.output);
  
  // Example query 3: Check wallet value
  const result3 = await agentExecutor.invoke({
    input: "Show me the NFTs in wallet 8YLKoCj1NwCa1eEWjVavXEV9C5pYJrjJxKNUiX14ypjv"
  });
  console.log("Result 3:", result3.output);
}

// Run the agent if this file is executed directly
if (require.main === module) {
  runAgent().catch(console.error);
} 