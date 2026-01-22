/*
  Warnings:

  - A unique constraint covering the columns `[soatoId]` on the table `Districts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[regionNo]` on the table `Region` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[soatoId]` on the table `Region` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Districts" ADD COLUMN     "nameUz" TEXT,
ADD COLUMN     "soatoId" INTEGER;

-- AlterTable
ALTER TABLE "Region" ADD COLUMN     "nameUz" TEXT,
ADD COLUMN     "regionNo" INTEGER,
ADD COLUMN     "soatoId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Districts_soatoId_key" ON "Districts"("soatoId");

-- CreateIndex
CREATE UNIQUE INDEX "Region_regionNo_key" ON "Region"("regionNo");

-- CreateIndex
CREATE UNIQUE INDEX "Region_soatoId_key" ON "Region"("soatoId");
