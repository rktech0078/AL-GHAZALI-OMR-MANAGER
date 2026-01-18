import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    },
  );

  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return response;
  }

  try {
    // Get session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Define protected routes and auth routes
    const protectedRoutes = ["/admin", "/teacher", "/student"];
    const authRoutes = ["/login", "/signup"];

    // Redirect unauthenticated users from protected routes
    if (
      !session &&
      protectedRoutes.some((prefix) => pathname.startsWith(prefix))
    ) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Redirect authenticated users from auth routes to home
    if (session && authRoutes.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // TEMPORARILY DISABLED: Role-based protection
    // Let pages handle their own role checks for now
    // This will be re-enabled after we confirm pages are loading

    return response;
  } catch (error) {
    // If anything fails, let the request through
    console.error('[Middleware] Error:', error);
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - files with extensions
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
