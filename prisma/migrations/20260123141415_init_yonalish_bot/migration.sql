/*
  Warnings:

  - You are about to drop the `Districts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Region` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RouteChannel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TelegramChannel` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Districts" DROP CONSTRAINT "Districts_regionId_fkey";

-- DropForeignKey
ALTER TABLE "RouteChannel" DROP CONSTRAINT "RouteChannel_channelId_fkey";

-- DropForeignKey
ALTER TABLE "RouteChannel" DROP CONSTRAINT "RouteChannel_fromRegionId_fkey";

-- DropForeignKey
ALTER TABLE "RouteChannel" DROP CONSTRAINT "RouteChannel_toRegionId_fkey";

-- DropTable
DROP TABLE "Districts";

-- DropTable
DROP TABLE "Region";

-- DropTable
DROP TABLE "RouteChannel";

-- DropTable
DROP TABLE "TelegramChannel";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "username" TEXT,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Direction" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "channelId" BIGINT NOT NULL,
    "channelUsername" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Direction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" SERIAL NOT NULL,
    "authorId" INTEGER NOT NULL,
    "directionId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "messageId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "Direction_name_key" ON "Direction"("name");

-- CreateIndex
CREATE INDEX "Announcement_authorId_idx" ON "Announcement"("authorId");

-- CreateIndex
CREATE INDEX "Announcement_directionId_idx" ON "Announcement"("directionId");

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_directionId_fkey" FOREIGN KEY ("directionId") REFERENCES "Direction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
