/*
  Warnings:

  - You are about to drop the `Group` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Location` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_locationId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_groupId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- DropTable
DROP TABLE "Group";

-- DropTable
DROP TABLE "Location";

-- DropTable
DROP TABLE "Order";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "Elon" (
    "id" TEXT NOT NULL,
    "username" TEXT,
    "phone" TEXT,
    "second_phne" TEXT,
    "from" TEXT,
    "to" TEXT,

    CONSTRAINT "Elon_pkey" PRIMARY KEY ("id")
);
