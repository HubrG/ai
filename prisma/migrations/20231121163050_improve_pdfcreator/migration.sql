-- AlterTable
ALTER TABLE "pdfCreator" ADD COLUMN     "length" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN     "personality" TEXT NOT NULL DEFAULT 'deep',
ADD COLUMN     "subject" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "tone" TEXT NOT NULL DEFAULT 'energetic';
