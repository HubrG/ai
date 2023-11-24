/*
  Warnings:

  - You are about to drop the column `pdfId` on the `userToken` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "userToken" DROP CONSTRAINT "userToken_pdfId_fkey";

-- AlterTable
ALTER TABLE "tokenSpent" ADD COLUMN     "pdfId" TEXT;

-- AlterTable
ALTER TABLE "userToken" DROP COLUMN "pdfId",
ADD COLUMN     "pdfCreatorId" TEXT;

-- AddForeignKey
ALTER TABLE "tokenSpent" ADD CONSTRAINT "tokenSpent_pdfId_fkey" FOREIGN KEY ("pdfId") REFERENCES "pdfCreator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userToken" ADD CONSTRAINT "userToken_pdfCreatorId_fkey" FOREIGN KEY ("pdfCreatorId") REFERENCES "pdfCreator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
