-- CreateTable
CREATE TABLE "AdminSeenSection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "seenCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSeenSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminSeenSection_userId_section_key" ON "AdminSeenSection"("userId", "section");

-- CreateIndex
CREATE INDEX "AdminSeenSection_userId_idx" ON "AdminSeenSection"("userId");

-- AddForeignKey
ALTER TABLE "AdminSeenSection" ADD CONSTRAINT "AdminSeenSection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
