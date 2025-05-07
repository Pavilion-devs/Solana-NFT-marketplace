interface CacheItem<T> {
  data: T;
  expiry: number; // Timestamp when this item expires
}

class MemoryCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  
  /**
   * Set a value in the cache with a TTL (Time To Live)
   * @param key - Cache key
   * @param value - Value to store
   * @param ttlSeconds - Time to live in seconds (default: 60)
   */
  set<T>(key: string, value: T, ttlSeconds = 60): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data: value, expiry });
  }
  
  /**
   * Get a value from the cache
   * @param key - Cache key
   * @returns The cached value or null if not found or expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    // Return null if item doesn't exist or has expired
    if (!item || item.expiry < Date.now()) {
      if (item) this.cache.delete(key); // Clean up expired item
      return null;
    }
    
    return item.data;
  }
  
  /**
   * Check if a key exists in the cache and is not expired
   * @param key - Cache key
   * @returns True if key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item || item.expiry < Date.now()) {
      if (item) this.cache.delete(key);
      return false;
    }
    return true;
  }
  
  /**
   * Delete a key from the cache
   * @param key - Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    this.cache.forEach((item, key) => {
      if (item.expiry < now) {
        this.cache.delete(key);
      }
    });
  }
}

// Export a singleton instance of the cache
export const cache = new MemoryCache();

// Run cleanup every 5 minutes
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000); 