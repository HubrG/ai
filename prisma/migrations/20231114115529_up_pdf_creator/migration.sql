-- AlterTable
ALTER TABLE "pdfCreator" ADD COLUMN     "lang" TEXT NOT NULL DEFAULT 'en',
ALTER COLUMN "updatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "pdfCreatorPlan" ALTER COLUMN "updatedAt" DROP NOT NULL;
