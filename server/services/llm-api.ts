import { LLMAgentType } from "@shared/types";

// Use .env variables for API keys
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || "";

// LLM provider configuration
const usesOpenAI = !!OPENAI_API_KEY;
const usesGemini = !!GEMINI_API_KEY && !usesOpenAI; // Use Gemini as fallback if OpenAI not available

// Function to call the appropriate LLM API based on available keys
export async function callLLMApi(prompt: string, agent: LLMAgentType): Promise<string> {
  if (!OPENAI_API_KEY && !GEMINI_API_KEY) {
    throw new Error("No LLM API keys found. Please provide either OPENAI_API_KEY or GEMINI_API_KEY.");
  }

  if (usesOpenAI) {
    return callOpenAI(prompt, agent);
  } else if (usesGemini) {
    return callGemini(prompt, agent);
  } else {
    throw new Error("No valid LLM API configuration found.");
  }
}

// Function to call OpenAI API
async function callOpenAI(prompt: string, agent: LLMAgentType): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: getSystemPrompt(agent)
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error(`Error calling OpenAI API for ${agent}:`, error);
    throw error;
  }
}

// Function to call Gemini API
async function callGemini(prompt: string, agent: LLMAgentType): Promise<string> {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: getSystemPrompt(agent) + "\n\n" + prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4000
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error(`Error calling Gemini API for ${agent}:`, error);
    throw error;
  }
}

// Function to get the system prompt based on agent type
function getSystemPrompt(agent: LLMAgentType): string {
  switch (agent) {
    case "securityAgent":
      return "You are an expert smart contract security auditor with extensive experience identifying vulnerabilities in Solidity code. You analyze contracts with extreme precision and attention to detail, focusing on security risks.";
    
    case "gasAgent":
      return "You are an expert Solidity gas optimization engineer who identifies inefficient patterns and suggests optimizations to reduce transaction costs. You have deep knowledge of the Ethereum Virtual Machine's gas mechanics.";
    
    case "logicAgent":
      return "You are an expert smart contract logic analyzer who identifies logical flaws, edge cases, and inconsistencies in contract behavior. You have a strong understanding of business logic and expected contract behavior.";
    
    default:
      return "You are an expert Solidity developer who analyzes smart contracts for issues and suggests improvements.";
  }
}
