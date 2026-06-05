import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/db";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      // You can specify which fields should be submitted, by default the username and password field are used.
      // Login pages are not yet built, so this is a placeholder.
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        // This is a placeholder for actual authentication logic.
        // In a real application, you would verify the credentials against your database.
        // For MVP, we'll allow any email/password to "authenticate" and create a user if not exists.
        if (credentials == null) return null;

        const email = credentials.email as string;
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          // Create a new user if not found (for simplified MVP login)
          user = await prisma.user.create({
            data: {
              email: email,
              handle: email.split("@")[0], // Simple handle generation
            },
          });
        }
        return user;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.handle = (user as any).handle; // Add handle to token
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        (session.user as any).handle = token.handle as string; // Add handle to session user
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin", // Custom sign-in page, will be created later
  },
});

export const getSessionUser = async () => {
  const session = await auth();
  return session?.user;
};
