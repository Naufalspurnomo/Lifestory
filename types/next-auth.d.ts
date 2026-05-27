import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id?: string;
      role?: string;
      subscriptionActive?: boolean;
      status?: string;
    };
  }

  interface User {
    role?: string;
    subscriptionActive?: boolean;
    status?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    subscriptionActive?: boolean;
    status?: string;
  }
}
