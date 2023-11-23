/*
  Warnings:

  - Made the column `idRef` on table `pdfCreatorPlan` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "pdfCreatorPlan" ALTER COLUMN "idRef" SET NOT NULL;
