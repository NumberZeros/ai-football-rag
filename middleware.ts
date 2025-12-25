import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  
  // Log request
  console.log(`→ ${request.method} ${request.nextUrl.pathname}`);

  // Continue with the request
  const response = NextResponse.next();

  // Add custom headers
  response.headers.set('X-Request-Id', crypto.randomUUID());
  response.headers.set('X-Powered-By', 'SpoChip AI');

  // Log response time
  const duration = Date.now() - startTime;
  console.log(`← ${request.method} ${request.nextUrl.pathname} - ${response.status} (${duration}ms)`);

  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
