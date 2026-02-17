import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPagePaths = ["/app", "/dashboard"];
const adminOnlyApiPaths = ["/api/users"];

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "https://lifestory.id",
  "https://www.lifestory.id",
];

function parseCsvEnv(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function hostMatches(host: string, allowedHost: string): boolean {
  return host === allowedHost || host.endsWith(`.${allowedHost}`);
}

function normalizeHost(value?: string | null): string {
  if (!value) return "";
  return value.split(",")[0].trim().split(":")[0].toLowerCase();
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    const forwardedHost = req.headers.get("x-forwarded-host");
    const requestHost = normalizeHost(forwardedHost || host);

    if (origin && process.env.NODE_ENV === "production") {
      let normalizedOrigin = "";
      let originHost = "";
      try {
        normalizedOrigin = new URL(origin).origin;
        originHost = normalizeHost(new URL(origin).host);
      } catch {
        return NextResponse.json(
          { error: "Forbidden - Invalid origin header" },
          { status: 403 }
        );
      }

      const configuredOrigins = [
        ...defaultAllowedOrigins,
        ...parseCsvEnv(process.env.ALLOWED_ORIGINS),
      ];

      const isSameOrigin =
        normalizedOrigin === req.nextUrl.origin ||
        (Boolean(originHost) && Boolean(requestHost) && originHost === requestHost);
      const isAllowedOrigin =
        isSameOrigin ||
        normalizedOrigin.includes("localhost") ||
        configuredOrigins.includes(normalizedOrigin);

      if (!isAllowedOrigin) {
        return NextResponse.json(
          { error: "Forbidden - Invalid origin" },
          { status: 403 }
        );
      }
    }

    if (host && process.env.NODE_ENV === "production") {
      const configuredHosts = parseCsvEnv(process.env.ALLOWED_HOSTS);
      if (configuredHosts.length > 0) {
        const hostWithoutPort = normalizeHost(host);
        const isValidHost = configuredHosts.some((allowedHost) =>
          hostMatches(hostWithoutPort, allowedHost)
        );

        if (!isValidHost) {
          return NextResponse.json(
            { error: "Forbidden - Invalid host" },
            { status: 403 }
          );
        }
      }
    }
  }

  const isProtectedPage = protectedPagePaths.some((path) =>
    pathname.startsWith(path)
  );
  const isAdminOnlyApi = adminOnlyApiPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (!isProtectedPage && !isAdminOnlyApi) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const hasSession = Boolean(token);
  const subscriptionActive = Boolean(token?.subscriptionActive);
  const isAdmin = token?.role === "admin";

  if (isProtectedPage) {
    if (!hasSession) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith("/dashboard") && !isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (pathname.startsWith("/app") && !subscriptionActive && !isAdmin) {
      const subUrl = new URL("/subscribe", req.url);
      subUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(subUrl);
    }
  }

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
    "/api/tree/:path*",
    "/api/invites/:path*",
    "/api/auth/:path*",
  ],
};
