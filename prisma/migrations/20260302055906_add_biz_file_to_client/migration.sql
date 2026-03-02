/*
  Warnings:

  - You are about to drop the column `salesId` on the `Client` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_salesId_fkey";

-- DropIndex
DROP INDEX "Client_salesId_idx";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "salesId",
ADD COLUMN     "bizFileName" TEXT,
ADD COLUMN     "bizFileUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pin" TEXT;
