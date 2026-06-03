const isDevelopment = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${
    isDevelopment ? " 'unsafe-eval'" : ""
  } https://vercel.live`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "media-src 'self' data: https: blob:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://vercel.live",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  isDevelopment ? "" : "upgrade-insecure-requests",
]
  .filter(Boolean)
  .join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Security headers
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/:path*",
        headers: [
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // XSS Protection (legacy browsers)
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Referrer policy - don't leak full URL to external sites
          {
            key: "Referrer-Policy",
            value: "no-referrer",
          },
          // Permissions policy - disable unnecessary browser features
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Prevent embedding in iframes (same as X-Frame-Options but more modern)
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          // Enforce HTTPS once the site has been reached over HTTPS.
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },

  // Note: HTTPS enforcement is delegated to the reverse proxy / CDN (Vercel,
  // Cloudflare, Nginx, etc.) rather than Next's redirect config. Handling it
  // here is fragile because Next's `redirects()` cannot cleanly interpolate
  // the request host into the destination URL, and running `next start`
  // directly (without a proxy) ends up crashing on every request.
  //
  // If you deploy to a platform that needs app-level enforcement, set it up
  // there (e.g. via middleware.ts) — don't re-add it here.
};

module.exports = nextConfig;
