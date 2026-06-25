-- Persistent admin replies for blog comments. Apply with: npx prisma migrate deploy

CREATE TABLE IF NOT EXISTS "BlogCommentReply" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogCommentReply_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BlogCommentReply_commentId_idx" ON "BlogCommentReply"("commentId");

DO $$ BEGIN
    ALTER TABLE "BlogCommentReply" ADD CONSTRAINT "BlogCommentReply_commentId_fkey"
        FOREIGN KEY ("commentId") REFERENCES "BlogComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
