import NextAuth, { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        handle: { label: "Handle", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials) return null;
        
        const handle = credentials.handle as string;
        let user = await prisma.user.findUnique({
          where: { handle },
        });

        if (!user) {
          // Create a new user if not found
          user = await prisma.user.create({
            data: {
              email: `${handle}@availeasy.test`, // Dummy email
              handle: handle,
            },
          });
        }
        return {
            id: user.id,
            email: user.email,
            handle: user.handle,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.handle = (user as any).handle;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.handle = token.handle as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
