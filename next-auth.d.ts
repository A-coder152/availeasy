import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      handle: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    handle: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    handle: string;
  }
}