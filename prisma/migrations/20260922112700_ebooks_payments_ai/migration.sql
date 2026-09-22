/*
  Warnings:

  - You are about to drop the column `createdAt` on the `BookChunk` table. All the data in the column will be lost.
  - You are about to drop the column `idx` on the `BookChunk` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `BookChunk` table. All the data in the column will be lost.
  - Added the required column `chunkNo` to the `BookChunk` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `BookChunk` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Category" ADD VALUE 'self_help';
ALTER TYPE "Category" ADD VALUE 'biography';

-- DropIndex
DROP INDEX "BookChunk_bookId_idx_key";

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "allowCredit" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "classificationCode" TEXT,
ADD COLUMN     "coverUrl" TEXT,
ADD COLUMN     "pages" INTEGER,
ADD COLUMN     "pdfPath" TEXT,
ADD COLUMN     "textReady" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "BookChunk" DROP COLUMN "createdAt",
DROP COLUMN "idx",
DROP COLUMN "text",
ADD COLUMN     "chunkNo" INTEGER NOT NULL,
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "pageNo" INTEGER;

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "buyerId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "creditSpent" INTEGER NOT NULL DEFAULT 0,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "qpayInvoiceId" TEXT,
    "qpayPaymentId" TEXT,
    "ebarimtId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiQuery" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "chunksUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "Payment_buyerId_idx" ON "Payment"("buyerId");

-- CreateIndex
CREATE INDEX "Payment_qpayInvoiceId_idx" ON "Payment"("qpayInvoiceId");

-- CreateIndex
CREATE INDEX "AiQuery_bookId_userId_idx" ON "AiQuery"("bookId", "userId");

-- CreateIndex
CREATE INDEX "Order_bookId_buyerId_idx" ON "Order"("bookId", "buyerId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiQuery" ADD CONSTRAINT "AiQuery_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
