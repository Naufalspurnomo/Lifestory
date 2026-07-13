import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPagePaths = ["/app", "/dashboard"];
const adminOnlyApiPaths = ["/api/users"];

const defaultAllowedOrigins = [
  "https://lifestory.co.id",
  "https://www.lifestory.co.id",
];
const defaultAllowedHosts = ["lifestory.co.id", "www.lifestory.co.id"];

function parseCsvEnv(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeOrigins(values: string[]): string[] {
  return values
    .map((value) => {
      try {
        return new URL(value).origin;
      } catch {
        return value;
      }
    })
    .filter(Boolean);
}

function hostMatches(host: string, allowedHost: string): boolean {
  return host === allowedHost;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");

    if (!origin && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Forbidden - Missing origin header" },
        { status: 403 }
      );
    }

    if (origin && process.env.NODE_ENV === "production") {
      let normalizedOrigin = "";
      try {
        normalizedOrigin = new URL(origin).origin;
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
      const allowedOrigins = normalizeOrigins(configuredOrigins);

      const isSameOrigin = normalizedOrigin === req.nextUrl.origin;
      const isAllowedOrigin =
        isSameOrigin || allowedOrigins.includes(normalizedOrigin);

      if (!isAllowedOrigin) {
        return NextResponse.json(
          { error: "Forbidden - Invalid origin" },
          { status: 403 }
        );
      }
    }

    if (host && process.env.NODE_ENV === "production") {
      const configuredHosts = [
        ...defaultAllowedHosts,
        ...parseCsvEnv(process.env.ALLOWED_HOSTS),
      ];
      const hostWithoutPort = host.split(":")[0];
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
  const accountStatus =
    typeof token?.status === "string" ? token.status : undefined;
  const isAdmin = token?.role === "admin";

  if (
    accountStatus === "suspended" ||
    accountStatus === "inactive" ||
    accountStatus === "pending_email"
  ) {
    if (isAdminOnlyApi) {
      return NextResponse.json(
        { error: "Forbidden - Account is not active" },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isProtectedPage) {
    if (!hasSession) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith("/dashboard") && !isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
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
    "/api/contact/:path*",
    "/api/trees/:path*",
    "/api/users/:path*",
    "/api/invites/:path*",
    "/api/auth/:path*",
  ],
};
