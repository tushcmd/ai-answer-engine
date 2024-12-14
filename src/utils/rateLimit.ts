import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Ensure environment variables are set
if (
  !process.env.UPSTASH_REDIS_REST_URL ||
  !process.env.UPSTASH_REDIS_REST_TOKEN
) {
  throw new Error("Upstash Redis configuration is missing");
}

// Initialize Redis client
const redis = new Redis({
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
