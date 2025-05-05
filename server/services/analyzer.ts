import { AnalysisOptions, AnalysisResponse, Finding } from "@shared/types";
import { storage } from "../storage";
import { parseSolidity, getContractInfo } from "./solidity-parser";
import { runSecurityAnalysis } from "./llm-agents/securityAgent";
import { runGasAnalysis } from "./llm-agents/gasAgent";
import { runLogicAnalysis } from "./llm-agents/logicAgent";
import { runRuleBasedChecks } from "./rule-checker";

export async function analyzeContract(
  code: string,
  options: AnalysisOptions,
  contractId: string
): Promise<AnalysisResponse> {
  try {
    // Parse the Solidity code and get contract info
    const { ast, contractName, lineCount } = await parseSolidity(code);
    
    // Store initial empty result
    const initialResult: AnalysisResponse = {
      contractId,
      contractName: contractName || "Unknown",
      timestamp: new Date(),
      lineCount,
      score: 100, // Start with perfect score
      findings: [],
      blockchain: options.blockchain,
      solidityVersion: options.solidityVersion,
    };
    
    await storage.storeAnalysisResult(contractId, initialResult);
    
    // Run rule-based checks first (these are faster)
    const ruleBasedFindings = await runRuleBasedChecks(code, ast);
    
    // Initialize array to collect all findings
    let findings: Finding[] = [...ruleBasedFindings];
    
    // Run selected analysis agents
    const analysisPromises: Promise<Finding[]>[] = [];
    
    if (options.security) {
      analysisPromises.push(runSecurityAnalysis(code, options.specificFunctions));
    }
    
    if (options.gas) {
      analysisPromises.push(runGasAnalysis(code, options.specificFunctions));
    }
    
    if (options.logic) {
      analysisPromises.push(runLogicAnalysis(code, options.specificFunctions));
    }
    
    // Wait for all analysis to complete
    const results = await Promise.allSettled(analysisPromises);
    
    // Collect successful results
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        findings = [...findings, ...result.value];
      }
    });
    
    // Calculate security score based on findings
    const score = calculateScore(findings, lineCount);
    
    // Create final analysis response
    const finalResult: AnalysisResponse = {
      ...initialResult,
      findings,
      score,
    };
    
    // Store the final result
    await storage.storeAnalysisResult(contractId, finalResult);
    
    return finalResult;
  } catch (error) {
    console.error('Error in contract analysis:', error);
    throw new Error(`Contract analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Calculate a security score based on findings and contract size
function calculateScore(findings: Finding[], lineCount: number): number {
  if (findings.length === 0) return 100;
  
  // Assign weights to different severity levels
  const severityWeights = {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3,
    info: 1,
  };
  
  // Calculate score deduction based on findings and their severity
  let deduction = 0;
  findings.forEach(finding => {
    const weight = severityWeights[finding.severity as keyof typeof severityWeights] || 1;
    deduction += weight;
  });
  
  // Normalize deduction based on contract size
  const normalizedDeduction = Math.min(100, (deduction / Math.sqrt(lineCount)) * 15);
  
  // Calculate final score (minimum score is 5)
  return Math.max(5, Math.round(100 - normalizedDeduction));
}
