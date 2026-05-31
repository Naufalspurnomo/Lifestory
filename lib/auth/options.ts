import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "../db";
import { checkRateLimit, getClientIdentifier, rateLimitConfigs } from "../rate-limit";
import { loginSchema } from "../validations";

let lastSessionRefreshWarningAt = 0;
const DUMMY_PASSWORD_HASH =
  "$2b$10$.PLJ1FbRlPa4.KmnoZ2.Uul4yKTUZ/7W/jf.ZFMGoza0IrIedMit6";

function markTokenSuspended(token: JWT) {
  token.role = "user";
  token.subscriptionActive = false;
  token.status = "suspended";
}

function warnSessionRefreshFailure(error: unknown) {
  const now = Date.now();
  if (now - lastSessionRefreshWarningAt < 30_000) return;

  lastSessionRefreshWarningAt = now;
  const message = error instanceof Error ? error.message : "Unknown error";
  console.warn(
    `[auth] Unable to refresh session from database. Marking session suspended until database is reachable. ${message}`
  );
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const validation = loginSchema.safeParse(credentials);
        if (!validation.success) return null;

        const email = validation.data.email.toLowerCase();
        const ipAddress = getClientIdentifier(request);
        const ipRateLimitError = await checkRateLimit(
          ipAddress,
          "auth-login-ip",
          rateLimitConfigs.login
        );
        if (ipRateLimitError) return null;

        const emailRateLimitError = await checkRateLimit(
          email,
          "auth-login-email",
          rateLimitConfigs.login
        );
        if (emailRateLimitError) return null;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        // Keep invalid users on the same bcrypt path to reduce account
        // enumeration through login response timing.
        const isValid = await compare(
          validation.data.password,
          user?.passwordHash ?? DUMMY_PASSWORD_HASH
        );
        if (!user || !isValid || user.status === "suspended") return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          subscriptionActive: user.subscriptionActive,
          status: user.status,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.subscriptionActive = user.subscriptionActive;
        token.status = user.status;
        token.sessionVersion = user.sessionVersion;
      }

      // Keep admin status changes effective for server-rendered pages and APIs.
      if (!user && token.sub) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: {
              subscriptionActive: true,
              role: true,
              status: true,
              sessionVersion: true,
            },
          });
          if (dbUser) {
            const tokenVersion = token.sessionVersion;
            if (
              typeof tokenVersion === "number" &&
              tokenVersion !== dbUser.sessionVersion
            ) {
              markTokenSuspended(token);
            } else {
              token.subscriptionActive =
                dbUser.status === "suspended"
                  ? false
                  : dbUser.subscriptionActive;
              token.role = dbUser.role;
              token.status = dbUser.status;
              token.sessionVersion = dbUser.sessionVersion;
            }
          } else {
            markTokenSuspended(token);
          }
        } catch (error) {
          warnSessionRefreshFailure(error);
          markTokenSuspended(token);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string | undefined;
        session.user.subscriptionActive = Boolean(token.subscriptionActive);
        session.user.status = token.status as string | undefined;
        session.user.id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
