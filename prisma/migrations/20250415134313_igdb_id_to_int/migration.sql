/*
  Warnings:

  - Changed the type of `igdbId` on the `Game` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "igdbId",
ADD COLUMN     "igdbId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Game_igdbId_key" ON "Game"("igdbId");
