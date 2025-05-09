import { Router } from 'express';
import { MagicEdenAIAgent } from '../services/aiAgent';

const router = Router();
const agent = new MagicEdenAIAgent();

/**
 * @openapi
 * tags:
 *   name: AI Agent
 *   description: NFT AI Agent endpoints
 * 
 * /api/ai/query:
 *   get:
 *     summary: Process a natural language query for NFT operations (GET)
 *     tags: [AI Agent]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: The natural language query
 *       - in: query
 *         name: walletAddress
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional wallet address for listing/delisting operations
 *     responses:
 *       200:
 *         description: Query processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   example: "Floor price for degods is 25.5 SOL"
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 *   
 *   post:
 *     summary: Process a natural language query for NFT operations (POST)
 *     tags: [AI Agent]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: The natural language query
 *                 example: "What is the floor price of DeGods?"
 *               walletAddress:
 *                 type: string
 *                 description: Optional wallet address for listing/delisting operations
 *                 example: "AaBbCc..."
 *     responses:
 *       200:
 *         description: Query processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   example: "Floor price for degods is 25.5 SOL"
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */

// Handle GET requests
router.get('/query', async (req, res) => {
  try {
    const { query, walletAddress } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required and must be a string' });
    }

    const response = await agent.processQuery(query, { 
      walletAddress: typeof walletAddress === 'string' ? walletAddress : undefined 
    });
    res.json({ response });
  } catch (error) {
    console.error('Error processing AI query:', error);
    res.status(500).json({ 
      error: 'Failed to process query',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Handle POST requests
router.post('/query', async (req, res) => {
  try {
    const { query, walletAddress } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const response = await agent.processQuery(query, { walletAddress });
    res.json({ response });
  } catch (error) {
    console.error('Error processing AI query:', error);
    res.status(500).json({ 
      error: 'Failed to process query',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router; 