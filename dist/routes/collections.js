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
const magicEdenService = __importStar(require("../services/magicEden"));
const router = (0, express_1.Router)();
/**
 * @route GET /collections/trending
 * @desc Get trending NFT collections
 */
router.get('/trending', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const trendingCollections = await magicEdenService.getTrendingCollections(limit, offset);
        res.status(200).json({
            success: true,
            data: trendingCollections
        });
    }
    catch (error) {
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
router.get('/:symbol/floor-price', async (req, res) => {
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
    }
    catch (error) {
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
router.get('/:symbol/stats', async (req, res) => {
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`Error fetching stats for collection ${req.params.symbol}:`, errorMessage);
        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
});
exports.default = router;
