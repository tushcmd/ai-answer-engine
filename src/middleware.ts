// TODO: Implement the code here to add rate limiting with Redis
// Refer to the Next.js Docs: https://nextjs.org/docs/app/building-your-application/routing/middleware
// Refer to Redis docs on Rate Limiting: https://upstash.com/docs/redis/sdks/ratelimit-ts/algorithms

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/utils/rateLimit";

export async function middleware(request: NextRequest) {
  try {
    // Extract IP address
    //request.ip ||
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

    // Check rate limit
    const rateLimitResult = await checkRateLimit(ip);

    if (!rateLimitResult.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests",
          retryAfter: rateLimitResult.resetTime,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - static files (_next/static)
     * - image files (_next/image)
     * - favicon
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

// export async function middleware(request: NextRequest) {
//   try {

//     const response = NextResponse.next();

//     return response;

//   } catch (error) {

//   }
// }

// Configure which paths the middleware runs on
// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except static files and images
//      */
//     "/((?!_next/static|_next/image|favicon.ico).*)",
//   ],
// };
