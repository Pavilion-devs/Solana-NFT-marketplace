import { Finding } from "@shared/types";
import { callLLMApi } from "../llm-api";

export async function runGasAnalysis(
  code: string,
  specificFunctions?: string
): Promise<Finding[]> {
  // Prepare code for analysis - if specificFunctions is provided, filter the code
  const codeToAnalyze = specificFunctions 
    ? extractSpecificFunctions(code, specificFunctions.split(',').map(f => f.trim()))
    : code;

  // Prompt template for gas optimization analysis
  const prompt = `
You are an expert Solidity gas optimization consultant. Analyze the following Solidity code for gas inefficiencies.
Focus specifically on:
1. Unnecessary storage reads/writes
2. Inefficient loop patterns
3. Redundant calculations
4. Opportunities for memory vs storage optimization
5. Variable packing possibilities
6. Using calldata instead of memory for read-only function parameters
7. Opportunities to use unchecked blocks for operations that cannot overflow
8. Using custom errors instead of revert strings
9. State variable caching in memory
10. Bit shifting vs division/multiplication by powers of 2

For each gas inefficiency found, provide:
- A descriptive title
- A clear explanation of the inefficiency
- The exact code snippet where the issue occurs
- The line numbers
- The severity (high, medium, low) based on gas savings potential
- A recommendation for improving gas efficiency
- A code snippet showing the optimized version

FORMAT YOUR RESPONSE AS JSON with the following structure:
[
  {
    "title": "Gas Inefficiency Title",
    "description": "Detailed explanation",
    "code": "affected code snippet",
    "lineNumbers": "line numbers (e.g., 15-20)",
    "severity": "severity level",
    "recommendation": "how to optimize it",
    "recommendationCode": "optimized code",
    "type": "gas"
  }
]

Here's the code to analyze:

\`\`\`solidity
${codeToAnalyze}
\`\`\`
`;

  try {
    // Call the LLM API with the gas optimization prompt
    const response = await callLLMApi(prompt, "gasAgent");
    
    // Parse the response to extract findings
    let findings: Finding[] = [];
    
    try {
      findings = JSON.parse(response);
      
      // Validate and ensure all findings have the required fields
      findings = findings.map(finding => ({
        ...finding,
        type: "gas" // Ensure type is set to gas
      }));
    } catch (error) {
      console.error("Error parsing gas agent response:", error);
      return [];
    }
    
    return findings;
  } catch (error) {
    console.error("Error in gas analysis:", error);
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
