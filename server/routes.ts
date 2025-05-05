import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeContract } from "./services/analyzer";
import { AnalysisOptions } from "@shared/types";
import { z } from "zod";

// Validation schema for analyze request body
const analyzeRequestSchema = z.object({
  code: z.string().min(1, "Code is required"),
  options: z.object({
    security: z.boolean().default(true),
    gas: z.boolean().default(true),
    logic: z.boolean().default(true),
    specificFunctions: z.string().optional(),
    blockchain: z.string().default("ethereum"),
    solidityVersion: z.string().default("auto"),
  }),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Endpoint to analyze a smart contract
  app.post("/api/analyze", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const { code, options } = analyzeRequestSchema.parse(req.body);

      // Store contract code temporarily
      const contractId = await storage.storeContract(code);

      // Analyze the contract
      const result = await analyzeContract(code, options as AnalysisOptions, contractId);

      // Return analysis results
      res.json(result);
    } catch (error) {
      console.error('Error analyzing contract:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
      }
    }
  });

  // Endpoint to get example contract
  app.get("/api/examples/contract", (_req: Request, res: Response) => {
    const exampleContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TokenSwap {
    address public owner;
    mapping(address => uint256) public balances;
    mapping(address => bool) public isExcluded;
    uint256 public feePercentage = 5; // 5% fee
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event FeeCollected(address indexed from, uint256 value);
    
    constructor() {
        owner = msg.sender;
        isExcluded[msg.sender] = true;
    }
    
    function deposit() external payable {
        balances[msg.sender] += msg.value;
        emit Transfer(address(0), msg.sender, msg.value);
    }
    
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        emit Transfer(msg.sender, address(0), amount);
    }
    
    function transfer(address to, uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        
        uint256 transferAmount = amount;
        if (!isExcluded[msg.sender] && !isExcluded[to]) {
            uint256 fee = (amount * feePercentage) / 100;
            transferAmount -= fee;
            balances[owner] += fee;
            emit FeeCollected(msg.sender, fee);
        }
        
        balances[to] += transferAmount;
        emit Transfer(msg.sender, to, transferAmount);
    }
    
    function setFeePercentage(uint256 _feePercentage) external {
        require(msg.sender == owner, "Only owner");
        require(_feePercentage <= 10, "Fee too high");
        feePercentage = _feePercentage;
    }
    
    function excludeFromFee(address account, bool excluded) external {
        require(msg.sender == owner, "Only owner");
        isExcluded[account] = excluded;
    }
}`;
    res.json({ code: exampleContract });
  });

  const httpServer = createServer(app);
  return httpServer;
}
