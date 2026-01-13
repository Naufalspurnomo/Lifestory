import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Protected page routes
const protectedPagePaths = ["/app", "/dashboard"];

// Protected API routes (admin only)
const adminOnlyApiPaths = ["/api/users"];

// List of allowed origins (untuk production, ganti dengan domain kamu)
const allowedOrigins = [
  "http://localhost:3000",
  "https://lifestory.id", // Ganti dengan domain production
  "https://www.lifestory.id",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ====== Origin Check untuk mutating requests ======
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");

    // Check if origin is allowed
    if (origin) {
      const isAllowedOrigin = allowedOrigins.some(
        (allowed) => origin === allowed || origin.includes("localhost")
      );

      if (!isAllowedOrigin && process.env.NODE_ENV === "production") {
        console.warn(`Blocked request from origin: ${origin}`);
        return NextResponse.json(
          { error: "Forbidden - Invalid origin" },
          { status: 403 }
        );
      }
    }

    // Verify host header matches expected
    if (host && process.env.NODE_ENV === "production") {
      const expectedHosts = ["lifestory.id", "www.lifestory.id"];
      const isValidHost = expectedHosts.some((h) => host.includes(h));

      if (!isValidHost) {
        console.warn(`Blocked request to host: ${host}`);
        return NextResponse.json(
          { error: "Forbidden - Invalid host" },
          { status: 403 }
        );
      }
    }
  }

  // ====== Check if protected ======
  const isProtectedPage = protectedPagePaths.some((path) =>
    pathname.startsWith(path)
  );
  const isAdminOnlyApi = adminOnlyApiPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (!isProtectedPage && !isAdminOnlyApi) {
    return NextResponse.next();
  }

  // ====== Get auth token ======
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const hasSession = Boolean(token);
  const subscriptionActive = Boolean(token?.subscriptionActive);
  const isAdmin = token?.role === "admin";

  // ====== Handle protected pages ======
  if (isProtectedPage) {
    if (!hasSession) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Dashboard requires admin role
    if (pathname.startsWith("/dashboard") && !isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // App requires subscription (unless admin)
    if (pathname.startsWith("/app") && !subscriptionActive && !isAdmin) {
      const subUrl = new URL("/subscribe", req.url);
      subUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(subUrl);
    }
  }

  // ====== Handle admin-only API routes ======
  if (isAdminOnlyApi) {
    if (!hasSession) {
      return NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/app/:path*",
    "/dashboard/:path*",
    "/api/users/:path*",
    "/api/auth/:path*", // Include auth routes for rate limiting later
  ],
};
