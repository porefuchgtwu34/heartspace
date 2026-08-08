import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  loginSchema,
  INVALID_CREDENTIALS_MESSAGE,
} from "@/lib/credentials";

/** Dummy hash so bcrypt.compare always runs (mitigates timing leaks when user missing) */
const DUMMY_HASH =
  "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse({
          identifier: credentials?.identifier,
          password: credentials?.password,
        });
        if (!parsed.success) {
          throw new Error(
            parsed.error.errors[0]?.message ?? INVALID_CREDENTIALS_MESSAGE
          );
        }

        const identifier = parsed.data.identifier.toLowerCase();
        const password = parsed.data.password;

        const user = await db.user.findFirst({
          where: {
            OR: [{ email: identifier }, { username: identifier }],
          },
        });

        // Always compare — even if user is missing — to reduce timing side-channels
        const hash = user?.passwordHash ?? DUMMY_HASH;
        const valid = await bcrypt.compare(password, hash);

        if (!user || !valid) {
          throw new Error(INVALID_CREDENTIALS_MESSAGE);
        }

        if (user.banned) {
          throw new Error(
            "This account has been suspended. Contact support."
          );
        }

        return {
          id: user.id,
          name: user.username,
          email: user.email,
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.username = (user as any).name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).username = token.username;
      }
      return session;
    },
  },
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      role: string;
      username: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    username: string;
  }
}
