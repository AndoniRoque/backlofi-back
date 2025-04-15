-- CreateEnum
CREATE TYPE "PlayStatus" AS ENUM ('PLAYING', 'COMPLETED', 'BACKLOG');

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "igdbId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT,
    "synopsis" TEXT,
    "playStatus" "PlayStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_igdbId_key" ON "Game"("igdbId");
