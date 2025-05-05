import { Finding } from "@shared/types";
import { callLLMApi } from "../llm-api";

export async function runSecurityAnalysis(
  code: string,
  specificFunctions?: string
): Promise<Finding[]> {
  // Prepare code for analysis - if specificFunctions is provided, filter the code
  const codeToAnalyze = specificFunctions 
    ? extractSpecificFunctions(code, specificFunctions.split(',').map(f => f.trim()))
    : code;

  // Prompt template for security analysis
  const prompt = `
You are an expert smart contract security auditor. Analyze the following Solidity code for security vulnerabilities.
Focus specifically on:
1. Reentrancy vulnerabilities
2. Access control issues
3. Integer overflow/underflow (even with SafeMath or Solidity 0.8+)
4. Unchecked return values
5. Front-running vulnerabilities
6. Denial of service vectors
7. Gas limitations
8. tx.origin usage
9. Randomness issues
10. Timestamp dependence

For each vulnerability found, provide:
- A descriptive title
- A clear explanation of the vulnerability
- The exact code snippet where the issue occurs
- The line numbers
- The severity (critical, high, medium, low)
- A recommendation for fixing the issue
- A code snippet showing the fix

FORMAT YOUR RESPONSE AS JSON with the following structure:
[
  {
    "title": "Vulnerability Title",
    "description": "Detailed explanation",
    "code": "affected code snippet",
    "lineNumbers": "line numbers (e.g., 15-20)",
    "severity": "severity level",
    "recommendation": "how to fix it",
    "recommendationCode": "code with the fix applied",
    "type": "security"
  }
]

Here's the code to analyze:

\`\`\`solidity
${codeToAnalyze}
\`\`\`
`;

  try {
    // Call the LLM API with the security prompt
    const response = await callLLMApi(prompt, "securityAgent");
    
    // Parse the response to extract findings
    let findings: Finding[] = [];
    
    try {
      findings = JSON.parse(response);
      
      // Validate and ensure all findings have the required fields
      findings = findings.map(finding => ({
        ...finding,
        type: "security" // Ensure type is set to security
      }));
    } catch (error) {
      console.error("Error parsing security agent response:", error);
      return [];
    }
    
    return findings;
  } catch (error) {
    console.error("Error in security analysis:", error);
    return [];
  }
}

// Helper function to extract specific functions from the code
function extractSpecificFunctions(
  code: string,
  functionNames: string[]
): string {
  // First, extract the contract declaration and imports
  const contractMatch = code.match(/(contract|library|interface)\s+(\w+)(\s+is\s+[\w,\s]+)?(\s*)\{/);
  
  if (!contractMatch) {
    return code; // Return full code if we can't parse it properly
  }
  
  const lines = code.split('\n');
  const extractedParts: string[] = [];
  
  // Add pragma, imports, and contract declaration
  let i = 0;
  let inComment = false;
  
  // Find and add all pragmas and imports
  while (i < lines.length) {
    const line = lines[i];
    
    // Handle multi-line comments
    if (line.includes('/*')) inComment = true;
    if (line.includes('*/')) inComment = false;
    
    // Add pragma, import statements, and comments at the top
    if (line.trim().startsWith('pragma') || 
        line.trim().startsWith('import') || 
        line.trim().startsWith('//') ||
        inComment) {
      extractedParts.push(line);
    } else if (contractMatch && line.includes(contractMatch[0])) {
      // Add contract declaration line
      extractedParts.push(line);
      break;
    }
    i++;
  }
  
  // Find function declarations and extract them
  let inFunction = false;
  let currentFunction = '';
  let bracketCount = 0;
  let functionAdded = false;
  
  for (; i < lines.length; i++) {
    const line = lines[i];
    
    // If we're at the end of the contract, add the closing bracket
    if (line.trim() === '}' && extractedParts.join('\n').includes('{') && bracketCount === 0) {
      extractedParts.push(line);
      break;
    }
    
    // Look for function declarations
    if (!inFunction && line.includes('function')) {
      const funcMatch = line.match(/function\s+(\w+)/);
      if (funcMatch && functionNames.includes(funcMatch[1])) {
        inFunction = true;
        bracketCount = 0;
        currentFunction = '';
        functionAdded = true;
      }
    }
    
    if (inFunction) {
      currentFunction += line + '\n';
      
      // Count brackets to determine function boundaries
      bracketCount += (line.match(/{/g) || []).length;
      bracketCount -= (line.match(/}/g) || []).length;
      
      if (bracketCount === 0) {
        inFunction = false;
        extractedParts.push(currentFunction);
      }
    } else if (line.trim() !== '') {
      // Include non-function contract elements (state variables, events, etc.)
      if (!line.includes('function')) {
        extractedParts.push(line);
      }
    }
  }
  
  // If we didn't find any of the specified functions, return the full code
  if (!functionAdded) {
    return code;
  }
  
  return extractedParts.join('\n');
}
