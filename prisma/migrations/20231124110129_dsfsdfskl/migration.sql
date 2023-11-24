/*
  Warnings:

  - The primary key for the `TokenSpentOnPdf` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[pdfId,tokenId]` on the table `TokenSpentOnPdf` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `TokenSpentOnPdf` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "TokenSpentOnPdf" DROP CONSTRAINT "TokenSpentOnPdf_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "TokenSpentOnPdf_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "TokenSpentOnPdf_pdfId_tokenId_key" ON "TokenSpentOnPdf"("pdfId", "tokenId");
