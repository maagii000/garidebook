-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('BOOK', 'UPLOAD_FEE', 'AD_FEE', 'MEMBERSHIP');

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_bookId_fkey";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "purpose" "PaymentPurpose" NOT NULL DEFAULT 'BOOK',
ADD COLUMN     "refId" TEXT,
ALTER COLUMN "bookId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;
