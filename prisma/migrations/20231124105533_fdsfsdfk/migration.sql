/*
  Warnings:

  - You are about to drop the column `pdfCreatorId` on the `tokenSpent` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "tokenSpent" DROP CONSTRAINT "tokenSpent_pdfCreatorId_fkey";

-- DropIndex
DROP INDEX "tokenSpent_pdfCreatorId_key";

-- AlterTable
ALTER TABLE "tokenSpent" DROP COLUMN "pdfCreatorId";

-- CreateTable
CREATE TABLE "TokenSpentOnPdf" (
    "pdfId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,

    CONSTRAINT "TokenSpentOnPdf_pkey" PRIMARY KEY ("pdfId","tokenId")
);

-- AddForeignKey
ALTER TABLE "TokenSpentOnPdf" ADD CONSTRAINT "TokenSpentOnPdf_pdfId_fkey" FOREIGN KEY ("pdfId") REFERENCES "pdfCreator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenSpentOnPdf" ADD CONSTRAINT "TokenSpentOnPdf_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "tokenSpent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
