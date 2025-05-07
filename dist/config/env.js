"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env file
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
exports.config = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    magicEdenApiKey: process.env.MAGIC_EDEN_API_KEY || '',
    heliusApiKey: "f3a344d5-c515-4ee1-a858-b190af0317a3",
};
// Validate required environment variables
const validateEnv = () => {
    const requiredVars = ['heliusApiKey'];
    for (const variable of requiredVars) {
        if (!exports.config[variable]) {
            console.error(`Environment variable ${variable} is missing!`);
            return false;
        }
    }
    return true;
};
exports.validateEnv = validateEnv;
