import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcryptjs from "bcryptjs";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@/db";
import { users, accounts, sessions, verificationTokens, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(getDb(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const db = getDb();
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user || !user.passwordHash) return null;

        const isValid = await bcryptjs.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        // For OAuth users, role isn't on the user object — fetch from DB
        const role = (user as { role?: string }).role;
        if (role) {
          token.role = role;
        } else {
          try {
            const db = getDb();
            const [dbUser] = await db
              .select({ role: users.role })
              .from(users)
              .where(eq(users.id, user.id!))
              .limit(1);
            token.role = dbUser?.role ?? "user";
          } catch {
            token.role = "user";
          }
        }
      }
      // Refresh plan on sign-in or update
      if (user || trigger === "update") {
        const userId = token.id as string;
        const role = token.role as string;
        if (role === "admin") {
          token.plan = "pro";
        } else {
          try {
            const db = getDb();
            const [sub] = await db
              .select({ status: subscriptions.status })
              .from(subscriptions)
              .where(eq(subscriptions.userId, userId))
              .limit(1);
            token.plan =
              sub && (sub.status === "trialing" || sub.status === "active")
                ? "pro"
                : "free";
          } catch {
            token.plan = "free";
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { plan?: string }).plan = (token.plan as string) ?? "free";
      }
      return session;
    },
  },
});
