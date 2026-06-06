import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function findUserByCredentials(phone?: string, email?: string) {
  if (!phone && !email) return null;
  return prisma.user.findFirst({
    where: {
      OR: [
        phone ? { phone } : undefined,
        email ? { email } : undefined,
      ].filter(Boolean) as object[],
    },
  });
}

export async function validatePassword(passwordHash: string, input: string) {
  return bcrypt.compare(input, passwordHash);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function createSession(userId: string, ipAddress?: string | null, userAgent?: string | null) {
  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.$transaction([
    prisma.session.create({ data: { sessionToken, userId, expires, ipAddress, userAgent } }),
    prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } }),
  ]);
  return sessionToken;
}

export async function revokeSession(sessionToken: string) {
  return prisma.session.delete({ where: { sessionToken } }).catch(() => null);
}

export async function isSessionValid(sessionToken: string) {
  const session = await prisma.session.findUnique({ where: { sessionToken }, select: { expires: true } });
  return session && session.expires > new Date();
}

export async function updateUserPassword(userId: string, newPassword: string) {
  const passwordHash = await hashPassword(newPassword);
  return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}
