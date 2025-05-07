// Example of how to use the Solana NFT MCP API with ChatGPT Function Calls

const { OpenAI } = require('openai');
require('dotenv').config();

// Base URL for the MCP API
const MCP_API_URL = "http://localhost:3000";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Define functions for ChatGPT to call
const functions = [
  {
    name: "get_trending_collections",
    description: "Get trending NFT collections on Solana",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "get_floor_price",
    description: "Gets floor price of an NFT collection on Solana",
    parameters: {
      type: "object",
      properties: {
        collection_symbol: {
          type: "string",
          description: "The collection symbol, e.g. 'madlads'"
        }
      },
      required: ["collection_symbol"]
    }
  },
  {
    name: "get_wallet_nfts",
    description: "Gets all NFTs in a Solana wallet",
    parameters: {
      type: "object",
      properties: {
        wallet_address: {
          type: "string",
          description: "The Solana wallet address"
        }
      },
      required: ["wallet_address"]
    }
  }
];

// Function implementations
async function getTrendingCollections() {
  const response = await fetch(`${MCP_API_URL}/collections/trending`);
  return await response.json();
}

async function getFloorPrice(collectionSymbol) {
  const response = await fetch(`${MCP_API_URL}/collections/${collectionSymbol}/floor-price`);
  return await response.json();
}

async function getWalletNFTs(walletAddress) {
  const response = await fetch(`${MCP_API_URL}/wallet/${walletAddress}/nfts`);
  return await response.json();
}

// Execute the function call based on ChatGPT's choice
async function executeFunction(functionName, args) {
  switch (functionName) {
    case "get_trending_collections":
      return await getTrendingCollections();
    case "get_floor_price":
      return await getFloorPrice(args.collection_symbol);
    case "get_wallet_nfts":
      return await getWalletNFTs(args.wallet_address);
    default:
      throw new Error(`Unknown function: ${functionName}`);
  }
}

// Main function to run ChatGPT with function calling
async function runChatGPT(userMessage) {
  // Initial call to get function call recommendation
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are a helpful assistant that can analyze Solana NFTs." },
      { role: "user", content: userMessage }
    ],
    functions,
    function_call: "auto",
  });

  const responseMessage = response.choices[0].message;

  // Check if the model wants to call a function
  if (responseMessage.function_call) {
    const functionName = responseMessage.function_call.name;
    const functionArgs = JSON.parse(responseMessage.function_call.arguments);
    
    console.log(`Calling function: ${functionName}`);
    
    // Call the function
    const functionResponse = await executeFunction(functionName, functionArgs);
    
    // Send the function response back to the model
    const secondResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant that can analyze Solana NFTs." },
        { role: "user", content: userMessage },
        responseMessage,
        { 
          role: "function", 
          name: functionName, 
          content: JSON.stringify(functionResponse)
        }
      ]
    });
    
    return secondResponse.choices[0].message.content;
  } else {
    // Model didn't call a function
    return responseMessage.content;
  }
}

// Example usage
async function main() {
  try {
    // Example 1: Get trending collections
    const response1 = await runChatGPT("What are the top trending NFT collections on Solana right now?");
    console.log("Example 1 Response:");
    console.log(response1);
    console.log("\n----------------------------------------\n");
    
    // Example 2: Get floor price
    const response2 = await runChatGPT("What's the current floor price of MadLads collection?");
    console.log("Example 2 Response:");
    console.log(response2);
    console.log("\n----------------------------------------\n");
    
    // Example 3: Get wallet NFTs
    const response3 = await runChatGPT("Show me what NFTs are in the wallet 8YLKoCj1NwCa1eEWjVavXEV9C5pYJrjJxKNUiX14ypjv");
    console.log("Example 3 Response:");
    console.log(response3);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the examples
main(); 