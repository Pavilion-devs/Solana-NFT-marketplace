import { Contract, AnalysisResponse } from "@shared/types";

// Interface for storage operations
export interface IStorage {
  storeContract(code: string): Promise<string>;
  getContract(id: string): Promise<Contract | undefined>;
  storeAnalysisResult(contractId: string, result: AnalysisResponse): Promise<void>;
  getAnalysisResult(contractId: string): Promise<AnalysisResponse | undefined>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private contracts: Map<string, Contract>;
  private analysisResults: Map<string, AnalysisResponse>;

  constructor() {
    this.contracts = new Map();
    this.analysisResults = new Map();
  }

  // Store contract code and return a unique ID
  async storeContract(code: string): Promise<string> {
    const id = `contract_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const contract: Contract = {
      id,
      code,
      createdAt: new Date(),
    };
    this.contracts.set(id, contract);

    // Cleanup old contracts (older than 1 hour)
    this.cleanup();

    return id;
  }

  // Retrieve contract by ID
  async getContract(id: string): Promise<Contract | undefined> {
    return this.contracts.get(id);
  }

  // Store analysis result for a contract
  async storeAnalysisResult(contractId: string, result: AnalysisResponse): Promise<void> {
    this.analysisResults.set(contractId, result);
  }

  // Retrieve analysis result by contract ID
  async getAnalysisResult(contractId: string): Promise<AnalysisResponse | undefined> {
    return this.analysisResults.get(contractId);
  }

  // Clean up old contracts and results (older than 1 hour)
  private cleanup(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Clean up old contracts
    for (const [id, contract] of this.contracts.entries()) {
      if (contract.createdAt < oneHourAgo) {
        this.contracts.delete(id);
        this.analysisResults.delete(id);
      }
    }
  }
}

// Create and export storage instance
export const storage = new MemStorage();
