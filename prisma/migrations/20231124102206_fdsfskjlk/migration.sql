/*
  Warnings:

  - You are about to drop the column `pdfCreatorId` on the `userToken` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "userToken" DROP CONSTRAINT "userToken_pdfCreatorId_fkey";

-- AlterTable
ALTER TABLE "userToken" DROP COLUMN "pdfCreatorId";
