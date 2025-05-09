import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  magicEdenApiKey: process.env.MAGIC_EDEN_API_KEY || '',
  heliusApiKey: process.env.HELIUS_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
};

// Validate required environment variables
export const validateEnv = (): boolean => {
  const requiredVars: Array<keyof typeof config> = ['heliusApiKey'];
  
  for (const variable of requiredVars) {
    if (!config[variable]) {
      console.error(`Environment variable ${variable} is missing!`);
      return false;
    }
  }
  
  return true;
}; 