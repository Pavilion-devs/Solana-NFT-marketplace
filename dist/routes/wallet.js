"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const heliusService = __importStar(require("../services/helius"));
const magicEdenService = __importStar(require("../services/magicEden"));
const router = (0, express_1.Router)();
/**
 * @route GET /wallet/:address/nfts
 * @desc Get all NFTs in a wallet
 */
router.get('/:address/nfts', async (req, res) => {
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`Error fetching NFTs for wallet ${req.params.address}:`, errorMessage);
        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
});
/**
 * @route POST /wallet/:address/list
 * @desc List an NFT for sale
 */
router.post('/:address/list', async (req, res) => {
    try {
        const { address } = req.params;
        const { mint, price } = req.body;
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
        if (typeof price !== 'number' || price <= 0) {
            res.status(400).json({
                success: false,
                error: 'Valid price is required'
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
        const result = await magicEdenService.listNft(mint, price, address);
        res.status(200).json({
            success: true,
            data: result
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`Error listing NFT for wallet ${req.params.address}:`, errorMessage);
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
router.post('/:address/delist', async (req, res) => {
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`Error delisting NFT for wallet ${req.params.address}:`, errorMessage);
        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
});
exports.default = router;
