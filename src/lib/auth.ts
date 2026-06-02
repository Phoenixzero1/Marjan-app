import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { z } from "zod";
import { isRateLimited, getClientIp } from "./rateLimit";

const loginSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
    Credentials({
      name: "credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        // Rate limit: max 5 login attempts per IP per 15 minutes
        if (request) {
          const ip = getClientIp(request);
          if (isRateLimited(`login:${ip}`, 5, 15 * 60_000)) {
            throw new Error("RATE_LIMITED");
          }
        }

        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { phone, email, password } = parsed.data;

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              phone ? { phone } : undefined,
              email ? { email } : undefined,
            ].filter(Boolean) as object[],
          },
        });

        if (!user?.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        if (user.status === "SUSPENDED" || user.status === "DELETED") return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email ?? undefined,
          name: `${user.firstName} ${user.lastName}`,
          phone: user.phone ?? undefined,
          role: user.role,
          image: user.avatarUrl ?? undefined,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "CUSTOMER";
        token.phone = (user as { phone?: string }).phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "CUSTOMER";
        (session.user as { phone?: string }).phone = token.phone as string;
      }
      return session;
    },
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        const existing = await prisma.user.findFirst({ where: { email: profile.email } });
        if (!existing) {
          const nameParts = (profile.name ?? "Google User").split(" ");
          await prisma.user.create({
            data: {
              email: profile.email,
              firstName: nameParts[0] ?? "کاربر",
              lastName: nameParts.slice(1).join(" ") || "گوگل",
              avatarUrl: (profile as { picture?: string }).picture,
              emailVerified: new Date(),
              status: "ACTIVE",
            },
          });
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
});
