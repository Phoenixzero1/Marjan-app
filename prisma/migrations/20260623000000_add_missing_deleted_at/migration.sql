-- Reconcile soft-delete columns.
-- `deletedAt` exists in schema.prisma for these models but was never created by an
-- earlier migration (the init migration predates the soft-delete fields). Without
-- these columns, any Prisma query that selects/filters them (e.g. the categories
-- GET uses `where: { deletedAt: null }`) fails with P2022 and returns a 500.
-- IF NOT EXISTS keeps this idempotent and safe even if the DB was built via `db push`.

ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Product"  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Order"    ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- schema.prisma declares @@index([deletedAt]) on BlogPost only
CREATE INDEX IF NOT EXISTS "BlogPost_deletedAt_idx" ON "BlogPost"("deletedAt");
