// Advanced rate limiter with per-minute, per-hour, and per-day limits

import { NextRequest } from 'next/server';

interface RateLimitConfig {
  perMinute: number;
  perHour: number;
  perDay: number;
}

interface RequestLog {
  timestamp: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: {
    minute: number;
    hour: number;
    day: number;
  };
  resetAt: {
    minute: number;
    hour: number;
    day: number;
  };
  limitType?: 'minute' | 'hour' | 'day';
}

class RateLimiter {
  private requests: Map<string, RequestLog[]> = new Map();
  private config: RateLimitConfig = {
    perMinute: 3,   // 3 requests per minute
    perHour: 20,    // 20 requests per hour  
    perDay: 50,     // 50 requests per day
  };

  /**
   * Get client identifier from request
   */
  private getClientId(request: NextRequest): string {
    // Priority: custom header > IP address > random fallback
    const customId = request.headers.get('x-client-id');
    if (customId) return customId;

    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();

    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp;

    // Fallback
    return 'unknown-client';
  }

  /**
   * Clean up old request logs
   */
  private cleanup(clientId: string, now: number): void {
    const logs = this.requests.get(clientId) || [];
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    // Keep only requests from last 24 hours
    const filtered = logs.filter(log => log.timestamp > oneDayAgo);
    
    if (filtered.length === 0) {
      this.requests.delete(clientId);
    } else {
      this.requests.set(clientId, filtered);
    }
  }

  /**
   * Check rate limit for a client
   */
  checkLimit(request: NextRequest): RateLimitResult {
    const clientId = this.getClientId(request);
    const now = Date.now();
    
    // Cleanup old logs
    this.cleanup(clientId, now);

    const logs = this.requests.get(clientId) || [];
    
    // Calculate time windows
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Count requests in each window
    const requestsLastMinute = logs.filter(log => log.timestamp > oneMinuteAgo).length;
    const requestsLastHour = logs.filter(log => log.timestamp > oneHourAgo).length;
    const requestsLastDay = logs.filter(log => log.timestamp > oneDayAgo).length;

    // Check limits and determine which one is exceeded
    let allowed = true;
    let limitType: 'minute' | 'hour' | 'day' | undefined;

    if (requestsLastMinute >= this.config.perMinute) {
      allowed = false;
      limitType = 'minute';
    } else if (requestsLastHour >= this.config.perHour) {
      allowed = false;
      limitType = 'hour';
    } else if (requestsLastDay >= this.config.perDay) {
      allowed = false;
      limitType = 'day';
    }

    // Calculate reset times
    const oldestMinuteLog = logs.find(log => log.timestamp > oneMinuteAgo);
    const oldestHourLog = logs.find(log => log.timestamp > oneHourAgo);
    const oldestDayLog = logs.find(log => log.timestamp > oneDayAgo);

    return {
      allowed,
      remaining: {
        minute: Math.max(0, this.config.perMinute - requestsLastMinute),
        hour: Math.max(0, this.config.perHour - requestsLastHour),
        day: Math.max(0, this.config.perDay - requestsLastDay),
      },
      resetAt: {
        minute: oldestMinuteLog ? oldestMinuteLog.timestamp + 60 * 1000 : now + 60 * 1000,
        hour: oldestHourLog ? oldestHourLog.timestamp + 60 * 60 * 1000 : now + 60 * 60 * 1000,
        day: oldestDayLog ? oldestDayLog.timestamp + 24 * 60 * 60 * 1000 : now + 24 * 60 * 60 * 1000,
      },
      limitType,
    };
  }

  /**
   * Record a request
   */
  recordRequest(request: NextRequest): void {
    const clientId = this.getClientId(request);
    const logs = this.requests.get(clientId) || [];
    
    logs.push({ timestamp: Date.now() });
    this.requests.set(clientId, logs);
  }

  /**
   * Get current rate limit status
   */
  getStatus(request: NextRequest): RateLimitResult {
    return this.checkLimit(request);
  }

  /**
   * Update rate limit configuration
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset limits for a specific client
   */
  resetClient(clientId: string): void {
    this.requests.delete(clientId);
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Helper function to format time until reset
export function formatResetTime(resetTimestamp: number): string {
  const now = Date.now();
  const diff = resetTimestamp - now;
  
  if (diff <= 0) return 'now';
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
