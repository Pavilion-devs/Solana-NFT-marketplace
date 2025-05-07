"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchData = fetchData;
const axios_1 = __importDefault(require("axios"));
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second
/**
 * Fetch data with retry logic and exponential backoff
 * @param url - The URL to fetch from
 * @param options - Axios request options
 * @returns Promise with the response data
 */
async function fetchData(url, options) {
    let lastError = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const response = await (0, axios_1.default)({
                url,
                ...options
            });
            return response.data;
        }
        catch (error) {
            lastError = error;
            // If it's not a rate limit error, throw immediately
            if (axios_1.default.isAxiosError(error) && error.response?.status !== 429) {
                throw new Error(`API request failed (${error.response?.status}): ${error.message}`);
            }
            // Calculate delay with exponential backoff
            const delay = BASE_DELAY * Math.pow(2, attempt);
            console.log(`Rate limit hit, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error(`API request failed after ${MAX_RETRIES} retries: ${lastError?.message}`);
}
