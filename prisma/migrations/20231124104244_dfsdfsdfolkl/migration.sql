/*
  Warnings:

  - You are about to drop the column `pdfId` on the `tokenSpent` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[pdfCreatorId]` on the table `tokenSpent` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "tokenSpent" DROP CONSTRAINT "tokenSpent_pdfId_fkey";

-- AlterTable
ALTER TABLE "tokenSpent" DROP COLUMN "pdfId",
ADD COLUMN     "pdfCreatorId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tokenSpent_pdfCreatorId_key" ON "tokenSpent"("pdfCreatorId");

-- AddForeignKey
ALTER TABLE "tokenSpent" ADD CONSTRAINT "tokenSpent_pdfCreatorId_fkey" FOREIGN KEY ("pdfCreatorId") REFERENCES "pdfCreator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
