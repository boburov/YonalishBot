/*
  Warnings:

  - The primary key for the `Direction` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `channelId` on the `Direction` table. All the data in the column will be lost.
  - You are about to drop the column `channelUsername` on the `Direction` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Direction` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Direction` table. All the data in the column will be lost.
  - You are about to drop the `Announcement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[from,to]` on the table `Direction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `from` to the `Direction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `to` to the `Direction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Announcement" DROP CONSTRAINT "Announcement_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Announcement" DROP CONSTRAINT "Announcement_directionId_fkey";

-- DropIndex
DROP INDEX "Direction_name_key";

-- AlterTable
ALTER TABLE "Direction" DROP CONSTRAINT "Direction_pkey",
DROP COLUMN "channelId",
DROP COLUMN "channelUsername",
DROP COLUMN "createdAt",
DROP COLUMN "name",
ADD COLUMN     "from" TEXT NOT NULL,
ADD COLUMN     "to" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Direction_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Direction_id_seq";

-- DropTable
DROP TABLE "Announcement";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "directionId" TEXT NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Channel_directionId_channelId_key" ON "Channel"("directionId", "channelId");

-- CreateIndex
CREATE INDEX "Direction_from_idx" ON "Direction"("from");

-- CreateIndex
CREATE INDEX "Direction_to_idx" ON "Direction"("to");

-- CreateIndex
CREATE UNIQUE INDEX "Direction_from_to_key" ON "Direction"("from", "to");

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_directionId_fkey" FOREIGN KEY ("directionId") REFERENCES "Direction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
