# Solana NFT MCP Server

A Modular Computation Provider (MCP) API for Solana NFTs that enables AI agents to interact with the Solana NFT ecosystem.

## 🚀 Features

- **Floor Price Tracker**: Get real-time floor prices for NFT collections
- **Trending Collections**: List hot/trending NFTs on Solana
- **Wallet Analyzer**: Fetch NFTs held in any Solana wallet
- **NFT Lister/Delister**: List or delist NFTs owned by a wallet (requires Magic Eden API key)
- **Rarity/Metadata Viewer**: Get traits, images, and rarity of a specific NFT
- **Collection Stats**: Volume, average sale price, sales history
- **AI Agent Compatibility**: Easy-to-consume REST API + Swagger/OpenAPI documentation

## 🛠️ Tech Stack

- TypeScript
- Express.js
- Magic Eden API (API key only required for listing/delisting)
- Helius API
- Swagger (OpenAPI v3)

## 📋 Prerequisites

- Node.js v16 or higher
- Helius API key
- Magic Eden API key (only if you need listing/delisting functionality)

## 🔧 Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/solana-nft-mcp.git
cd solana-nft-mcp
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
NODE_ENV=development
HELIUS_API_KEY=your_helius_api_key
MAGIC_EDEN_API_KEY=your_magic_eden_api_key  # Optional: only needed for listing/delisting
```

4. Build the project
```bash
npm run build
```

5. Start the server
```bash
npm start
```

For development with hot reload:
```bash
npm run dev
```

## 📚 API Documentation

API documentation is available at `http://localhost:3000/docs` when the server is running.

### Core Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|--------------|
| `/collections/trending` | `GET` | Returns trending Solana NFT collections | No |
| `/collections/:symbol/floor-price` | `GET` | Gets floor price of specified collection | No |
| `/collections/:symbol/stats` | `GET` | Volume, avg price, listing/sale stats | No |
| `/wallet/:address/nfts` | `GET` | Lists NFTs in a wallet | No |
| `/wallet/:address/list` | `POST` | Lists a wallet NFT (requires mint + price) | Yes* |
| `/wallet/:address/delist` | `POST` | Delists a wallet NFT | Yes* |

\* Requires Magic Eden API key

## 🤖 AI Agent Integration

### LangChain Integration Example

```typescript
import { Tool } from "langchain/tools";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";

// Create tools for the agent
const floorPriceTool = new Tool({
  name: "get_floor_price",
  description: "Gets floor price of an NFT collection on Solana",
  func: async (collectionSymbol: string) => {
    const response = await fetch(`http://localhost:3000/collections/${collectionSymbol}/floor-price`);
    const data = await response.json();
    return JSON.stringify(data);
  }
});

// Setup agent
const llm = new ChatOpenAI({ temperature: 0 });
const tools = [floorPriceTool];
const agent = createOpenAIFunctionsAgent({ llm, tools });
const agentExecutor = AgentExecutor.fromAgentAndTools({ agent, tools });

// Use the agent
const result = await agentExecutor.invoke({
  input: "What is the floor price of the MadLads collection?"
});
console.log(result.output);
```

### ChatGPT Plugin Integration

To use this API as a ChatGPT plugin, add the following to your AI configuration:

1. Plugin manifest URL: `http://localhost:3000/.well-known/ai-plugin.json`
2. API schema: `http://localhost:3000/docs`

## 🧪 Example Use Cases

- 📉 **Monitor Market**: "Tell me when SMB Gen2 floor drops below 10 SOL."
- 💰 **Arbitrage**: "Find NFTs in my wallet that are 2 SOL above current floor."
- 🛒 **Auto-listing**: "List my MadLads NFT for 59.5 SOL."
- 📊 **Wallet Review**: "How much is my NFT wallet worth right now?"
- 🔍 **Trends**: "What are the top trending NFTs on Solana this week?"
- 🎨 **NFT Detail**: "Show traits and rarity of this mint address."

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ✍️ Author

Your Name - [@yourusername](https://twitter.com/yourusername) 