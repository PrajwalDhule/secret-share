// src/lib/auth.ts

import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials"; // For email/password login
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/server/db";
import { verifyPassword } from "@/utils/hash";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma), // Use Prisma as the database adapter
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        name: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.name || !credentials?.password) {
          throw new Error("InvalidCredentials");
        }

        const user = await prisma.user.findFirst({
          where: {
            name: credentials.name,
          },
        });

        if (!user || !user.password) {
          throw new Error("UserNotFound");
        }

        const isPasswordValid = await verifyPassword(
          user.password,
          credentials.password
        );

        if (!isPasswordValid) {
          throw new Error("InvalidPassword");
        }

        return user
      },
    }),
  ],
  callbacks: {
    session: ({ session, token }) => {
      console.log("TOKEN in session callback", token);
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
        },
      };
    },
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id; 
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};