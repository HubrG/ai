/*
  Warnings:

  - Added the required column `pdfId` to the `userToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "userToken" ADD COLUMN     "pdfId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "userToken" ADD CONSTRAINT "userToken_pdfId_fkey" FOREIGN KEY ("pdfId") REFERENCES "pdfCreator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
