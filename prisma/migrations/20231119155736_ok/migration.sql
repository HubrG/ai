/*
  Warnings:

  - Added the required column `GPTModelUsed` to the `tokenSpent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tokenSpent" ADD COLUMN     "GPTModelUsed" TEXT NOT NULL,
ADD COLUMN     "gpt" TEXT NOT NULL DEFAULT '';
