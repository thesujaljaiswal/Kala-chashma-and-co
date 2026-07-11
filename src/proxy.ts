import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Basic In-Memory Rate Limiter Map
// Note: In Vercel serverless/edge environments, this memory is per-isolate.
// It provides basic abuse protection but is not a global limit.
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export default function proxy(request: NextRequest) {
  const res = NextResponse.next();

  // 1. Add strict Security Headers to harden against XSS and clickjacking
  res.headers.set('X-DNS-Prefetch-Control', 'on');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('X-Content-Type-Options', 'nosniff');

  // 2. Rate Limiting Logic (DDoS / Brute force protection)
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';
  
  // Garbage collection: Clean up old entries occasionally to prevent memory leaks
  if (Math.random() < 0.01) {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now - value.timestamp > 60000) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (ip !== 'unknown') {
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    // Stricter limits for authentication routes, generous for standard pages
    const maxRequests = request.nextUrl.pathname.startsWith('/api') || request.nextUrl.pathname === '/login' ? 20 : 150;

    const rateLimitData = rateLimitMap.get(ip);
    
    if (rateLimitData) {
      if (now - rateLimitData.timestamp < windowMs) {
        if (rateLimitData.count >= maxRequests) {
          // Block the request completely
          return new NextResponse('Too Many Requests. Please try again later.', { 
            status: 429,
            headers: {
              'Retry-After': '60',
              'Content-Type': 'text/plain'
            }
          });
        }
        rateLimitData.count++;
      } else {
        // Reset window after 1 minute has passed
        rateLimitMap.set(ip, { count: 1, timestamp: now });
      }
    } else {
      // First request from this IP
      rateLimitMap.set(ip, { count: 1, timestamp: now });
    }
  }

  return res;
}

export const config = {
  matcher: [
    // Apply to all routes except static assets
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
