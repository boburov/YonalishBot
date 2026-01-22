/*
  Warnings:

  - You are about to drop the `Elon` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Elon";

-- CreateTable
CREATE TABLE "TelegramChannel" (
    "id" TEXT NOT NULL,
    "chatId" BIGINT NOT NULL,
    "username" TEXT,
    "title" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteChannel" (
    "id" TEXT NOT NULL,
    "fromRegionId" TEXT NOT NULL,
    "toRegionId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RouteChannel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramChannel_chatId_key" ON "TelegramChannel"("chatId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramChannel_username_key" ON "TelegramChannel"("username");

-- CreateIndex
CREATE INDEX "RouteChannel_fromRegionId_idx" ON "RouteChannel"("fromRegionId");

-- CreateIndex
CREATE INDEX "RouteChannel_toRegionId_idx" ON "RouteChannel"("toRegionId");

-- CreateIndex
CREATE INDEX "RouteChannel_channelId_idx" ON "RouteChannel"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "RouteChannel_fromRegionId_toRegionId_key" ON "RouteChannel"("fromRegionId", "toRegionId");

-- AddForeignKey
ALTER TABLE "RouteChannel" ADD CONSTRAINT "RouteChannel_fromRegionId_fkey" FOREIGN KEY ("fromRegionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteChannel" ADD CONSTRAINT "RouteChannel_toRegionId_fkey" FOREIGN KEY ("toRegionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteChannel" ADD CONSTRAINT "RouteChannel_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "TelegramChannel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
