-- AlterTable
ALTER TABLE "tokenSpent" ADD COLUMN     "Input" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "Output" BOOLEAN NOT NULL DEFAULT false;
