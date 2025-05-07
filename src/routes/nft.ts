import { Router, Request, Response } from 'express';
import * as heliusService from '../services/helius';

const router = Router();

/**
 * @route GET /nft/:mint/metadata
 * @desc Get NFT metadata
 */
router.get('/:mint/metadata', async (req: Request, res: Response): Promise<void> => {
  try {
    const { mint } = req.params;
    
    if (!mint) {
      res.status(400).json({
        success: false,
        error: 'NFT mint address is required'
      });
      return;
    }
    
    const metadata = await heliusService.getNFTMetadata(mint);
    
    res.status(200).json({
      success: true,
      data: metadata
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Error fetching metadata for NFT ${req.params.mint}:`, errorMessage);
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

export default router; 