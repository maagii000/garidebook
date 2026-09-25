-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "downloads" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lookingFor" TEXT NOT NULL DEFAULT 'study';
