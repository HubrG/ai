-- AlterTable
ALTER TABLE "pdfCreatorContent" ADD COLUMN     "gptModelId" TEXT,
ADD COLUMN     "lang" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "length" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "personality" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "tone" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "pdfCreatorPlan" ADD COLUMN     "gptModelId" TEXT,
ADD COLUMN     "lang" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "length" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "personality" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "tone" TEXT NOT NULL DEFAULT '';

-- AddForeignKey
ALTER TABLE "pdfCreatorPlan" ADD CONSTRAINT "pdfCreatorPlan_gptModelId_fkey" FOREIGN KEY ("gptModelId") REFERENCES "tokenPricing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdfCreatorContent" ADD CONSTRAINT "pdfCreatorContent_gptModelId_fkey" FOREIGN KEY ("gptModelId") REFERENCES "tokenPricing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
