import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import crypto from "crypto";

// Ensure environment variables are set
if (
  !process.env.UPSTASH_REDIS_REST_URL ||
  !process.env.UPSTASH_REDIS_REST_TOKEN
) {
  throw new Error("Upstash Redis configuration is missing");
}

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Configure rate limiter
export const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
  analytics: true,
});

// Rate limit function for IP-based limiting
export async function checkRateLimit(ip: string) {
  try {
    const { success, reset, remaining } = await rateLimit.limit(ip);

    return {
      allowed: success,
      resetTime: reset,
      remainingRequests: remaining,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return {
      allowed: false,
      resetTime: Date.now(),
      remainingRequests: 0,
    };
  }
}

// Caching utility
export class CacheManager {
  // Generate a deterministic cache key
  static generateCacheKey(input: { message: string; urls?: string[] }): string {
    const key = JSON.stringify(input);
    return `cache:${crypto.createHash("md5").update(key).digest("hex")}`;
  }

  // Get cached response
  static async get(key: string) {
    try {
      return await redis.get(key);
    } catch (error) {
      console.error("Cache retrieval error:", error);
      return null;
    }
  }

  // Set cached response with expiration
  static async set(key: string, value: unknown, ttlSeconds: number = 3600) {
    try {
      await redis.set(key, value, { ex: ttlSeconds });
    } catch (error) {
      console.error("Cache storage error:", error);
    }
  }

  // Check and return cached response, or null if not found
  static async getCachedResponse(input: { message: string; urls?: string[] }) {
    const cacheKey = this.generateCacheKey(input);
    return await this.get(cacheKey);
  }

  // Cache the response
  static async cacheResponse(
    input: { message: string; urls?: string[] },
    response: unknown,
    ttlSeconds: number = 3600
  ) {
    const cacheKey = this.generateCacheKey(input);
    await this.set(cacheKey, response, ttlSeconds);
  }
}
