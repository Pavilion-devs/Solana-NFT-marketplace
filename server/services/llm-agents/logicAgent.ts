import { Finding } from "@shared/types";
import { callLLMApi } from "../llm-api";

export async function runLogicAnalysis(
  code: string,
  specificFunctions?: string
): Promise<Finding[]> {
  // Prepare code for analysis - if specificFunctions is provided, filter the code
  const codeToAnalyze = specificFunctions 
    ? extractSpecificFunctions(code, specificFunctions.split(',').map(f => f.trim()))
    : code;

  // Prompt template for logic analysis
  const prompt = `
You are an expert smart contract logic analyzer. Analyze the following Solidity code for logical flaws and edge cases.
Focus specifically on:
1. Incorrect state transitions
2. Missing validation checks
3. Business logic inconsistencies
4. Edge cases that weren't handled
5. Potential for unexpected contract behavior
6. Improper event emissions
7. Logic that might not match developer's intent
8. Missing function modifiers or guard conditions
9. Rounding errors or precision issues
10. Logical flaws in conditional statements

For each logical flaw found, provide:
- A descriptive title
- A clear explanation of the logical issue
- The exact code snippet where the issue occurs
- The line numbers
- The severity (high, medium, low) based on potential impact
- A recommendation for fixing the logical issue
- A code snippet showing the fix

FORMAT YOUR RESPONSE AS JSON with the following structure:
[
  {
    "title": "Logic Flaw Title",
    "description": "Detailed explanation",
    "code": "affected code snippet",
    "lineNumbers": "line numbers (e.g., 15-20)",
    "severity": "severity level",
    "recommendation": "how to fix it",
    "recommendationCode": "code with the fix applied",
    "type": "logic"
  }
]

Here's the code to analyze:

\`\`\`solidity
${codeToAnalyze}
\`\`\`
`;

  try {
    // Call the LLM API with the logic analysis prompt
    const response = await callLLMApi(prompt, "logicAgent");
    
    // Parse the response to extract findings
    let findings: Finding[] = [];
    
    try {
      findings = JSON.parse(response);
      
      // Validate and ensure all findings have the required fields
      findings = findings.map(finding => ({
        ...finding,
        type: "logic" // Ensure type is set to logic
      }));
    } catch (error) {
      console.error("Error parsing logic agent response:", error);
      return [];
    }
    
    return findings;
  } catch (error) {
    console.error("Error in logic analysis:", error);
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
