import { Finding } from "@shared/types";

// Basic rule-based checker to catch common issues
export async function runRuleBasedChecks(code: string, ast: any): Promise<Finding[]> {
  const findings: Finding[] = [];
  
  // Check for reentrancy vulnerabilities
  checkReentrancy(code, findings);
  
  // Check for unchecked external calls
  checkUncheckedCalls(code, findings);
  
  // Check for tx.origin usage
  checkTxOrigin(code, findings);
  
  // Check for potential integer overflow/underflow
  checkIntegerOverflow(code, findings);
  
  // Check for unbounded loops
  checkUnboundedLoops(code, findings);
  
  return findings;
}

// Check for potential reentrancy vulnerabilities
function checkReentrancy(code: string, findings: Finding[]) {
  // Pattern: state change after external call
  const lines = code.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    // Look for external calls
    if (lines[i].includes('.call{') || lines[i].includes('.call(')) {
      // Check if state variables are modified after the call
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        if (lines[j].includes('=')) {
          findings.push({
            title: "Potential Reentrancy Vulnerability",
            description: "State variables are modified after an external call, which could lead to reentrancy attacks. Follow the checks-effects-interactions pattern by performing all state changes before making external calls.",
            code: lines.slice(i, j + 1).join('\n'),
            lineNumbers: `${i + 1}-${j + 1}`,
            severity: "critical",
            recommendation: "Move the state variable modification before the external call.",
            recommendationCode: "// First, update state\n// Then, make external call",
            type: "security"
          });
          break;
        }
      }
    }
  }
}

// Check for unchecked external calls
function checkUncheckedCalls(code: string, findings: Finding[]) {
  const lines = code.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    // Look for calls without success checks
    if ((lines[i].includes('.call') || lines[i].includes('.send')) && 
        !lines[i].includes('require(') && 
        !lines[i].includes('if (') && 
        !lines[i].match(/=.*?call/)) {
      
      findings.push({
        title: "Unchecked External Call",
        description: "External call result is not checked, which could lead to silent failures and unexpected behavior.",
        code: lines[i],
        lineNumbers: `${i + 1}`,
        severity: "high",
        recommendation: "Always check the return value of low-level calls.",
        recommendationCode: "bool success = address.call{value: amount}(\"\");\nrequire(success, \"Call failed\");",
        type: "security"
      });
    }
  }
}

// Check for tx.origin usage
function checkTxOrigin(code: string, findings: Finding[]) {
  const lines = code.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    // Look for tx.origin in conditionals
    if (lines[i].includes('tx.origin')) {
      findings.push({
        title: "tx.origin Usage",
        description: "Using tx.origin for authorization is dangerous and can lead to phishing attacks. Use msg.sender instead for authorization checks.",
        code: lines[i],
        lineNumbers: `${i + 1}`,
        severity: "high",
        recommendation: "Replace tx.origin with msg.sender for authorization checks.",
        recommendationCode: lines[i].replace('tx.origin', 'msg.sender'),
        type: "security"
      });
    }
  }
}

// Check for potential integer overflow/underflow
function checkIntegerOverflow(code: string, findings: Finding[]) {
  const pragmaLine = code.match(/pragma\s+solidity\s+(.*?);/);
  
  // Only check for overflow if using Solidity < 0.8.0
  if (pragmaLine && pragmaLine[1] && !pragmaLine[1].startsWith('0.8') && !pragmaLine[1].startsWith('^0.8')) {
    // Check if SafeMath is used
    if (!code.includes('SafeMath')) {
      findings.push({
        title: "Missing SafeMath",
        description: "Solidity versions before 0.8.0 don't have automatic overflow checking. SafeMath should be used to prevent integer overflows and underflows.",
        code: pragmaLine[0],
        lineNumbers: "1",
        severity: "medium",
        recommendation: "Either upgrade to Solidity 0.8.0+ or use the SafeMath library for arithmetic operations.",
        recommendationCode: "import \"@openzeppelin/contracts/utils/math/SafeMath.sol\";\n\nusing SafeMath for uint256;",
        type: "security"
      });
    }
  }
}

// Check for unbounded loops
function checkUnboundedLoops(code: string, findings: Finding[]) {
  const lines = code.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    // Look for loops over arrays or mappings
    if (lines[i].includes('for (') || lines[i].includes('for(')) {
      // Check if there's a potential for unbounded iteration
      if (lines[i].includes('.length') && !lines[i].includes('<=') && !lines[i].includes('<')) {
        findings.push({
          title: "Unbounded Loop",
          description: "This loop might iterate over an unbounded array, which could lead to out-of-gas errors if the array grows too large.",
          code: lines[i],
          lineNumbers: `${i + 1}`,
          severity: "medium",
          recommendation: "Limit the maximum number of iterations or implement pagination.",
          recommendationCode: "// Add a limit to the loop\nfor (uint i = 0; i < Math.min(array.length, MAX_ITERATIONS); i++) { ... }",
          type: "gas"
        });
      }
    }
  }
}
