interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// Endpoint-specific TTL configuration (in milliseconds)
const ENDPOINT_TTL_CONFIG: Record<string, number> = {
  // Live/dynamic data - short TTL
  '/fixtures': 2 * 60 * 1000,          // 2 minutes (live matches change frequently)
  '/fixtures/statistics': 5 * 60 * 1000, // 5 minutes
  '/fixtures/events': 2 * 60 * 1000,    // 2 minutes
  '/fixtures/lineups': 10 * 60 * 1000,  // 10 minutes (lineups don't change during match)
  '/injuries': 60 * 60 * 1000,          // 60 minutes
  
  // Semi-static data - medium TTL
  '/standings': 30 * 60 * 1000,         // 30 minutes
  '/fixtures/headtohead': 24 * 60 * 60 * 1000, // 24 hours
  
  // Static data - long TTL
  '/leagues': 7 * 24 * 60 * 60 * 1000,  // 7 days
  '/teams': 7 * 24 * 60 * 60 * 1000,    // 7 days
  '/timezone': 30 * 24 * 60 * 60 * 1000, // 30 days
};

class APIFootballCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 60 * 60 * 1000; // 60 minutes

  /**
   * Generate cache key from URL and params
   */
  private generateKey(endpoint: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');
    return `${endpoint}?${sortedParams}`;
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(endpoint: string, params: Record<string, any>): T | null {
    const key = this.generateKey(endpoint, params);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cache entry with custom, endpoint-specific, or default TTL
   */
  set<T>(
    endpoint: string,
    params: Record<string, any>,
    data: T,
    ttl?: number
  ): void {
    const key = this.generateKey(endpoint, params);
    // Priority: custom TTL > endpoint-specific TTL > default TTL
    const effectiveTTL = ttl || ENDPOINT_TTL_CONFIG[endpoint] || this.defaultTTL;
    const expiresAt = Date.now() + effectiveTTL;

    this.cache.set(key, { data, expiresAt });
  }

  /**
   * Clear specific cache entry
   */
  delete(endpoint: string, params: Record<string, any>): void {
    const key = this.generateKey(endpoint, params);
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const apiFootballCache = new APIFootballCache();

// Auto cleanup every 10 minutes
setInterval(() => {
  apiFootballCache.cleanup();
}, 10 * 60 * 1000);
