import { Router, Request, Response } from 'express';
import * as magicEdenService from '../services/magicEden';

const router = Router();

/**
 * @route GET /collections/trending
 * @desc Get trending NFT collections
 */
router.get('/trending', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const trendingCollections = await magicEdenService.getTrendingCollections(limit, offset);
    
    res.status(200).json({
      success: true,
      data: trendingCollections
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error fetching trending collections:', errorMessage);
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * @route GET /collections/:symbol/floor-price
 * @desc Get floor price for a specific collection
 */
router.get('/:symbol/floor-price', async (req: Request, res: Response): Promise<void> => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      res.status(400).json({
        success: false,
        error: 'Collection symbol is required'
      });
      return;
    }
    
    const floorPrice = await magicEdenService.getFloorPrice(symbol);
    
    res.status(200).json({
      success: true,
      data: floorPrice
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Error fetching floor price for collection ${req.params.symbol}:`, errorMessage);
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * @route GET /collections/:symbol/stats
 * @desc Get statistics for a specific collection
 */
router.get('/:symbol/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      res.status(400).json({
        success: false,
        error: 'Collection symbol is required'
      });
      return;
    }
    
    const stats = await magicEdenService.getCollectionStats(symbol);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Error fetching stats for collection ${req.params.symbol}:`, errorMessage);
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

export default router; 