import axios, { AxiosRequestConfig } from 'axios';

const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second

/**
 * Fetch data with retry logic and exponential backoff
 * @param url - The URL to fetch from
 * @param options - Axios request options
 * @returns Promise with the response data
 */
export async function fetchData<T>(url: string, options: AxiosRequestConfig): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await axios({
        url,
        ...options
      });
      
      return response.data;
    } catch (error) {
      lastError = error as Error;
      
      // If it's not a rate limit error, throw immediately
      if (axios.isAxiosError(error) && error.response?.status !== 429) {
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