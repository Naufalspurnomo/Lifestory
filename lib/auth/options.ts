import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "../db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Find user from database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) return null;
        if (user.status === "suspended") return null;

        const isValid = await compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          subscriptionActive: user.subscriptionActive,
          status: user.status,
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
      }

      // Keep admin status changes effective for server-rendered pages and APIs.
      if (!user && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { subscriptionActive: true, role: true, status: true },
        });
        if (dbUser) {
          token.subscriptionActive =
            dbUser.status === "suspended" ? false : dbUser.subscriptionActive;
          token.role = dbUser.role;
          token.status = dbUser.status;
        } else {
          token.subscriptionActive = false;
          token.status = "suspended";
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
