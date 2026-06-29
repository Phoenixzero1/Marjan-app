import { prisma } from "./prisma";

interface AuditParams {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ip?: string | null;
  ua?: string | null;
}

/**
 * Fire-and-forget audit log — never awaited, never throws, never blocks the response.
 * Writes to SystemLog with level INFO.
 */
export function audit(params: AuditParams): void {
  prisma.systemLog
    .create({
      data: {
        ...(params.userId ? { user: { connect: { id: params.userId } } } : {}),
        level: "INFO",
        action: params.action,
        details: {
          entity: params.entity,
          ...(params.entityId ? { entityId: params.entityId } : {}),
          ...(params.oldValue !== undefined ? { oldValue: params.oldValue } : {}),
          ...(params.newValue !== undefined ? { newValue: params.newValue } : {}),
        },
        ipAddress: params.ip ?? null,
        userAgent: params.ua ?? null,
      },
    })
    .catch((err) => { console.error("[audit]", err?.message ?? err); });
}
