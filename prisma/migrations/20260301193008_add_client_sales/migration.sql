/*
  Warnings:

  - You are about to drop the column `addr` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `bizCertPath` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `bizNo` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `careNo` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `ceoName` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `ownerUserId` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `remark` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `tel` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `packV` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `stockV` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `mobile` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Order` table. All the data in the column will be lost.
  - The `status` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `loginPinHash` on the `User` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `DailyPin` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[bizRegNo]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SALES', 'ADMIN');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'DONE');

-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_ownerUserId_fkey";

-- DropForeignKey
ALTER TABLE "DailyPin" DROP CONSTRAINT "DailyPin_userId_fkey";

-- DropIndex
DROP INDEX "Client_ownerUserId_idx";

-- DropIndex
DROP INDEX "Client_ownerUserId_name_key";

-- DropIndex
DROP INDEX "Order_clientId_idx";

-- DropIndex
DROP INDEX "Order_status_idx";

-- DropIndex
DROP INDEX "Order_userId_idx";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "addr",
DROP COLUMN "bizCertPath",
DROP COLUMN "bizNo",
DROP COLUMN "careNo",
DROP COLUMN "ceoName",
DROP COLUMN "email",
DROP COLUMN "ownerUserId",
DROP COLUMN "remark",
DROP COLUMN "tel",
ADD COLUMN     "bizRegNo" TEXT,
ADD COLUMN     "memo" TEXT,
ADD COLUMN     "receiverAddr" TEXT,
ADD COLUMN     "receiverMob" TEXT,
ADD COLUMN     "receiverName" TEXT,
ADD COLUMN     "receiverTel" TEXT,
ADD COLUMN     "salesId" TEXT;

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "packV",
DROP COLUMN "price",
DROP COLUMN "stockV";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "mobile",
DROP COLUMN "phone",
ADD COLUMN     "boxCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "receiverMob" TEXT,
ADD COLUMN     "receiverTel" TEXT,
ADD COLUMN     "shippingFee" INTEGER NOT NULL DEFAULT 3850,
DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'REQUESTED';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "loginPinHash",
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'SALES';

-- DropTable
DROP TABLE "DailyPin";

-- CreateIndex
CREATE UNIQUE INDEX "Client_bizRegNo_key" ON "Client"("bizRegNo");

-- CreateIndex
CREATE INDEX "Client_salesId_idx" ON "Client"("salesId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_salesId_fkey" FOREIGN KEY ("salesId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
