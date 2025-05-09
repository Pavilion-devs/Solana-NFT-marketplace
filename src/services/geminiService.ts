import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';

// Initialize Gemini AI with API key
const genAI = new GoogleGenerativeAI(config.geminiApiKey);