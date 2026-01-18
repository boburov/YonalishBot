-- DropEnum
DROP TYPE "OrderStatus";

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Districts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regionId" TEXT,

    CONSTRAINT "Districts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Districts" ADD CONSTRAINT "Districts_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;
