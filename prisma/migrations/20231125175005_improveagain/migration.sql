-- DropForeignKey
ALTER TABLE "TokenSpentOnPdf" DROP CONSTRAINT "TokenSpentOnPdf_pdfId_fkey";

-- DropForeignKey
ALTER TABLE "TokenSpentOnPdf" DROP CONSTRAINT "TokenSpentOnPdf_tokenId_fkey";

-- AddForeignKey
ALTER TABLE "TokenSpentOnPdf" ADD CONSTRAINT "TokenSpentOnPdf_pdfId_fkey" FOREIGN KEY ("pdfId") REFERENCES "pdfCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenSpentOnPdf" ADD CONSTRAINT "TokenSpentOnPdf_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "tokenSpent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
