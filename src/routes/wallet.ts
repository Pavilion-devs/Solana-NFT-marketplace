import { Router, Request, Response } from 'express';
import * as heliusService from '../services/helius';
import * as magicEdenService from '../services/magicEden';

const router = Router();

/**
 * @route GET /wallet/:address/nfts
 * @desc Get all NFTs in a wallet
 */
router.get('/:address/nfts', async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.params;
    
    if (!address) {
      res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
      return;
    }
    
    const walletNFTs = await heliusService.getWalletNFTs(address);
    
    res.status(200).json({
      success: true,
      data: walletNFTs
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Error fetching NFTs for wallet ${req.params.address}:`, errorMessage);
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});


/**
 * @route POST /wallet/:address/delist
 * @desc Delist an NFT from sale
 */
router.post('/:address/delist', async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.params;
    const { mint } = req.body;
    
    if (!address) {
      res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
      return;
    }
    
    if (!mint) {
      res.status(400).json({
        success: false,
        error: 'NFT mint address is required'
      });
      return;
    }
    
    // Verify NFT ownership
    const walletNFTs = await heliusService.getWalletNFTs(address);
    const ownsNFT = walletNFTs.tokens.some(token => token.mint === mint);
    
    if (!ownsNFT) {
      res.status(403).json({
        success: false,
        error: `Wallet ${address} does not own NFT with mint ${mint}`
      });
      return;
    }
    
    const result = await magicEdenService.delistNft(mint, address);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Error delisting NFT for wallet ${req.params.address}:`, errorMessage);
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

export default router; 