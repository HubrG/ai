-- AlterTable
ALTER TABLE "pdfCreator" ADD COLUMN     "gptModelId" TEXT;

-- AddForeignKey
ALTER TABLE "pdfCreator" ADD CONSTRAINT "pdfCreator_gptModelId_fkey" FOREIGN KEY ("gptModelId") REFERENCES "tokenPricing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
