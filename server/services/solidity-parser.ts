import { spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

interface ParsedContract {
  ast: any; // We'd use a more specific type in a real implementation
  contractName: string | null;
  lineCount: number;
}

export async function parseSolidity(code: string): Promise<ParsedContract> {
  try {
    // Count the number of lines in the code
    const lineCount = code.split('\n').length;
    
    // Extract contract name using regex
    const contractNameMatch = code.match(/contract\s+(\w+)/);
    const contractName = contractNameMatch ? contractNameMatch[1] : null;
    
    // Create a temporary file for the Solidity code
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'solidity-parser-'));
    const tempFile = path.join(tempDir, `${contractName || 'Contract'}.sol`);
    
    fs.writeFileSync(tempFile, code);

    // Simplified AST representation for demo purposes
    // In a real implementation, we would use solc or a Solidity parser library
    const ast = {
      contractName,
      sourceFile: tempFile,
      functions: extractFunctions(code),
      stateVariables: extractStateVariables(code),
      events: extractEvents(code),
    };
    
    // Clean up temporary file
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    return {
      ast,
      contractName,
      lineCount,
    };
  } catch (error) {
    console.error('Error parsing Solidity code:', error);
    return {
      ast: null,
      contractName: null,
      lineCount: code.split('\n').length,
    };
  }
}

export function getContractInfo(code: string) {
  const pragmaMatch = code.match(/pragma\s+solidity\s+(.*?);/);
  const solidityVersion = pragmaMatch ? pragmaMatch[1] : null;
  
  const contractNameMatch = code.match(/contract\s+(\w+)/);
  const contractName = contractNameMatch ? contractNameMatch[1] : null;
  
  return {
    solidityVersion,
    contractName
  };
}

// Helper function to extract functions from Solidity code
function extractFunctions(code: string) {
  const functions = [];
  const functionMatches = code.matchAll(/function\s+(\w+)\s*\(([^)]*)\)(?:\s*(?:external|public|internal|private|view|pure|payable)\s*)*(?:\s*returns\s*\(([^)]*)\))?\s*(?:{|;)/g);
  
  for (const match of functionMatches) {
    functions.push({
      name: match[1],
      params: match[2],
      returns: match[3],
      lineNumber: getLineNumber(code, match.index || 0),
    });
  }
  
  return functions;
}

// Helper function to extract state variables from Solidity code
function extractStateVariables(code: string) {
  const stateVariables = [];
  const variableMatches = code.matchAll(/(\w+(?:\[\])?\s+(?:public|private|internal)?\s+(?:immutable|constant)?\s+)?(\w+)\s*(?:=\s*([^;]+))?;/g);
  
  for (const match of variableMatches) {
    if (match[0].includes('function')) continue; // Skip function declarations
    
    stateVariables.push({
      type: match[1]?.trim(),
      name: match[2],
      value: match[3]?.trim(),
      lineNumber: getLineNumber(code, match.index || 0),
    });
  }
  
  return stateVariables;
}

// Helper function to extract events from Solidity code
function extractEvents(code: string) {
  const events = [];
  const eventMatches = code.matchAll(/event\s+(\w+)\s*\(([^)]*)\);/g);
  
  for (const match of eventMatches) {
    events.push({
      name: match[1],
      params: match[2],
      lineNumber: getLineNumber(code, match.index || 0),
    });
  }
  
  return events;
}

// Helper function to get the line number from character index
function getLineNumber(code: string, index: number): number {
  return code.substring(0, index).split('\n').length;
}
