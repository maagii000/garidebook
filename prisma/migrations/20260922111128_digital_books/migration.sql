-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "isDigital" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pageCount" INTEGER;

-- CreateTable
CREATE TABLE "BookChunk" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "idx" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookChunk_bookId_idx" ON "BookChunk"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "BookChunk_bookId_idx_key" ON "BookChunk"("bookId", "idx");

-- AddForeignKey
ALTER TABLE "BookChunk" ADD CONSTRAINT "BookChunk_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
