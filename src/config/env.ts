import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  magicEdenApiKey: process.env.MAGIC_EDEN_API_KEY || '',
  heliusApiKey: "f3a344d5-c515-4ee1-a858-b190af0317a3",
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