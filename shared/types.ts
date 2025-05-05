// LLM agent types
export type LLMAgentType = "securityAgent" | "gasAgent" | "logicAgent";

// Contract entity
export interface Contract {
  id: string;
  code: string;
  createdAt: Date;
}

// Finding entity
export interface Finding {
  title: string;
  description: string;
  code: string;
  lineNumbers: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  recommendation: string;
  recommendationCode?: string;
  type: "security" | "gas" | "logic";
}

// Analysis options
export interface AnalysisOptions {
  security: boolean;
  gas: boolean;
  logic: boolean;
  specificFunctions?: string;
  blockchain?: string;
  solidityVersion?: string;
}

// Analysis response
export interface AnalysisResponse {
  contractId: string;
  contractName: string;
  timestamp: Date;
  lineCount: number;
  score: number;
  findings: Finding[];
  blockchain?: string;
  solidityVersion?: string;
}
