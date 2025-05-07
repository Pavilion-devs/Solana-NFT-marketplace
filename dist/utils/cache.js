"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = void 0;
class MemoryCache {
    cache = new Map();
    /**
     * Set a value in the cache with a TTL (Time To Live)
     * @param key - Cache key
     * @param value - Value to store
     * @param ttlSeconds - Time to live in seconds (default: 60)
     */
    set(key, value, ttlSeconds = 60) {
        const expiry = Date.now() + (ttlSeconds * 1000);
        this.cache.set(key, { data: value, expiry });
    }
    /**
     * Get a value from the cache
     * @param key - Cache key
     * @returns The cached value or null if not found or expired
     */
    get(key) {
        const item = this.cache.get(key);
        // Return null if item doesn't exist or has expired
        if (!item || item.expiry < Date.now()) {
            if (item)
                this.cache.delete(key); // Clean up expired item
            return null;
        }
        return item.data;
    }
    /**
     * Check if a key exists in the cache and is not expired
     * @param key - Cache key
     * @returns True if key exists and is not expired
     */
    has(key) {
        const item = this.cache.get(key);
        if (!item || item.expiry < Date.now()) {
            if (item)
                this.cache.delete(key);
            return false;
        }
        return true;
    }
    /**
     * Delete a key from the cache
     * @param key - Cache key
     */
    delete(key) {
        this.cache.delete(key);
    }
    /**
     * Clear all entries from the cache
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        this.cache.forEach((item, key) => {
            if (item.expiry < now) {
                this.cache.delete(key);
            }
        });
    }
}
// Export a singleton instance of the cache
exports.cache = new MemoryCache();
// Run cleanup every 5 minutes
setInterval(() => {
    exports.cache.cleanup();
}, 5 * 60 * 1000);
