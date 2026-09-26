-- AlterTable
ALTER TABLE "ChatRoom" ADD COLUMN "matchId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoom_matchId_key" ON "ChatRoom"("matchId");
