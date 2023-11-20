/*
  Warnings:

  - You are about to drop the column `Input` on the `tokenSpent` table. All the data in the column will be lost.
  - You are about to drop the column `Output` on the `tokenSpent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tokenSpent" DROP COLUMN "Input",
DROP COLUMN "Output",
ADD COLUMN     "input" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "output" BOOLEAN NOT NULL DEFAULT false;
