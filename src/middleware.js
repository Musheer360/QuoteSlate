// middleware.js
import { NextResponse } from "next/server";
import { createClient } from "@vercel/edge-config";

export const config = {
  matcher: "/api/:path*",
};

// In-memory storage
let blockedIPs = new Set();
let lastBlocklistRefresh = 0;

// Configuration
const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const VIOLATION_THRESHOLD = 3;
const BLOCKLIST_REFRESH_MS = 5 * 60 * 1000; // Refresh every 5 minutes

// Request tracking
const requestCounts = new Map();
const violationCounts = new Map();

// Edge Config client initialization
let edgeConfig;
try {
  edgeConfig = createClient(process.env.EDGE_CONFIG);
} catch (error) {
  console.error("Failed to initialize Edge Config client:", error);
}

export default async function middleware(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const now = Date.now();

  try {
    // Check if IP is blocked (using in-memory cache)
    if (blockedIPs.has(ip)) {
      return new NextResponse(
        JSON.stringify({ error: "Access blocked due to repeated violations" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    // Refresh blocklist from Edge Config (every 5 minutes)
    if (edgeConfig && now - lastBlocklistRefresh > BLOCKLIST_REFRESH_MS) {
      try {
        const blockedList = (await edgeConfig.get("blocked_ips")) || [];
        blockedIPs = new Set(blockedList);
        lastBlocklistRefresh = now;

        if (blockedIPs.has(ip)) {
          return new NextResponse(
            JSON.stringify({
              error: "Access blocked due to repeated violations",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } },
          );
        }
      } catch (error) {
        console.error("Failed to refresh blocklist:", error);
      }
    }

    // Clean expired rate limit records
    for (const [reqIp, data] of requestCounts.entries()) {
      if (now > data.expires) {
        requestCounts.delete(reqIp);
        // Also clear violation count when window expires
        violationCounts.delete(reqIp);
      }
    }

    // Rate limiting logic
    if (!requestCounts.has(ip)) {
      requestCounts.set(ip, {
        count: 1,
        expires: now + RATE_WINDOW_MS,
      });
    } else {
      const record = requestCounts.get(ip);
      record.count++;
    }

    const requestData = requestCounts.get(ip);

    if (requestData.count > RATE_LIMIT) {
      const currentViolations = (violationCounts.get(ip) || 0) + 1;
      violationCounts.set(ip, currentViolations);

      // DIRECT BLOCKING: If this is the 3rd violation, add to blocked list
      if (currentViolations >= VIOLATION_THRESHOLD) {
        // Add to in-memory block list immediately
        blockedIPs.add(ip);

        // Also update Edge Config (if available)
        if (edgeConfig) {
          try {
            const currentBlocked = (await edgeConfig.get("blocked_ips")) || [];
            if (!currentBlocked.includes(ip)) {
              await edgeConfig.set("blocked_ips", [...currentBlocked, ip]);
              console.log(
                `IP ${ip} blocked after ${VIOLATION_THRESHOLD} violations`,
              );
            }
          } catch (error) {
            console.error(
              "Failed to update blocked IPs in Edge Config:",
              error,
            );
          }
        }

        return new NextResponse(
          JSON.stringify({
            error:
              "You have been blocked due to repeated rate limit violations.",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new NextResponse(
        JSON.stringify({
          error: "Too many requests, please try again later.",
          retryAfter: Math.ceil((requestData.expires - now) / 1000),
          violationCount: currentViolations,
          threshold: VIOLATION_THRESHOLD,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil(
              (requestData.expires - now) / 1000,
            ).toString(),
          },
        },
      );
    }

    // Allow request to proceed to API
    return NextResponse.next();
  } catch (error) {
    // Global error handler - if middleware fails, let the request through
    console.error("Middleware error, forwarding to API:", error);
    return NextResponse.next();
  }
}
