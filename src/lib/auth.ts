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

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
// How often to re-check the DB for revocation (60 seconds)
const REVOKE_CHECK_INTERVAL_MS = 60_000;

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
        try {
          // Rate limit: max 5 login attempts per IP per 15 minutes
          if (request) {
            const ip = getClientIp(request as Request);
            if (isRateLimited(`login:${ip}`, 5, 15 * 60_000)) {
              throw new Error("RATE_LIMITED");
            }
          }

          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) {
            console.log("[auth] schema parse failed:", parsed.error.issues);
            return null;
          }

          const { phone, email, password } = parsed.data;
          console.log("[auth] authorize attempt — email:", email, "phone:", phone);

          const user = await prisma.user.findFirst({
            where: {
              OR: [
                phone ? { phone } : undefined,
                email ? { email } : undefined,
              ].filter(Boolean) as object[],
            },
          });

          console.log("[auth] user found:", !!user, "hasHash:", !!user?.passwordHash);

          if (!user?.passwordHash) return null;

          const isValid = await bcrypt.compare(password, user.passwordHash);
          console.log("[auth] password valid:", isValid);

          if (!isValid) return null;

          if (user.status === "SUSPENDED" || user.status === "DELETED") return null;

          // Extract IP and User-Agent for session tracking
          const ip = request ? getClientIp(request as Request) : null;
          const ua = request
            ? ((request as Request).headers as Headers).get("user-agent") ?? null
            : null;

          // Create a tracked session record — wrapped so DB errors don't block login
          const sessionToken = crypto.randomUUID();
          const expires = new Date(Date.now() + SESSION_TTL_MS);

          try {
            await prisma.$transaction([
              prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
              }),
              prisma.session.create({
                data: {
                  sessionToken,
                  userId: user.id,
                  expires,
                  ipAddress: ip,
                  userAgent: ua,
                },
              }),
            ]);
          } catch (sessionErr) {
            console.error("[auth] session tracking failed (non-fatal):", sessionErr);
          }

          return {
            id: user.id,
            email: user.email ?? undefined,
            name: `${user.firstName} ${user.lastName}`,
            phone: user.phone ?? undefined,
            role: user.role,
            image: user.avatarUrl ?? undefined,
            sessionToken,
          };
        } catch (err) {
          console.error("[auth] authorize error:", err);
          throw err;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, account }) {
      // ── First sign-in ────────────────────────────────────────────────────────
      if (user) {
        const customUser = user as {
          id?: string;
          role?: string;
          phone?: string;
          sessionToken?: string;
        };

        if (account?.provider === "google") {
          // For Google OAuth: look up the real DB user (created in signIn callback)
          // and create a tracked session record
          const dbUser = await prisma.user.findFirst({
            where: { email: user.email ?? "" },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;

            const sessionToken = crypto.randomUUID();
            await prisma.session.create({
              data: {
                sessionToken,
                userId: dbUser.id,
                expires: new Date(Date.now() + SESSION_TTL_MS),
                // IP/UA not available in OAuth jwt callback
              },
            });
            token.sessionToken = sessionToken;

            await prisma.user.update({
              where: { id: dbUser.id },
              data: { lastLoginAt: new Date() },
            });
          }
        } else {
          // Credentials provider — user object has the DB id and sessionToken
          token.id = customUser.id;
          token.role = customUser.role ?? "CUSTOMER";
          token.phone = customUser.phone;
          token.sessionToken = customUser.sessionToken;
        }

        token.sessionChecked = Date.now();
        return token;
      }

      // ── Subsequent requests: revocation check ────────────────────────────────
      // Check at most once every REVOKE_CHECK_INTERVAL_MS to avoid a DB hit on
      // every single API request while still invalidating revoked sessions quickly.
      if (token.sessionToken) {
        const now = Date.now();
        const lastChecked = (token.sessionChecked as number) ?? 0;

        if (now - lastChecked > REVOKE_CHECK_INTERVAL_MS) {
          const tracked = await prisma.session.findUnique({
            where: { sessionToken: token.sessionToken as string },
            select: { expires: true },
          });

          // Session was deleted (revoked by admin) or expired in DB
          if (!tracked || tracked.expires < new Date()) return null;

          token.sessionChecked = now;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = (token as { role?: string }).role ?? "CUSTOMER";
        (session.user as { phone?: string }).phone = token.phone as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
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
