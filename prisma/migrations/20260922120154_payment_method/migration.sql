-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('QPAY', 'TRANSFER');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "method" "PaymentMethod" NOT NULL DEFAULT 'QPAY';
