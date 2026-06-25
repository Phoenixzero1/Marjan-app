-- Persistent admin replies for product reviews and contact messages.
-- Apply with: npx prisma migrate deploy

CREATE TABLE IF NOT EXISTS "ReviewReply" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewReply_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ContactReply" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sentVia" TEXT NOT NULL DEFAULT 'panel',
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactReply_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ReviewReply_reviewId_idx" ON "ReviewReply"("reviewId");
CREATE INDEX IF NOT EXISTS "ContactReply_contactId_idx" ON "ContactReply"("contactId");

DO $$ BEGIN
    ALTER TABLE "ReviewReply" ADD CONSTRAINT "ReviewReply_reviewId_fkey"
        FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "ContactReply" ADD CONSTRAINT "ContactReply_contactId_fkey"
        FOREIGN KEY ("contactId") REFERENCES "ContactMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
