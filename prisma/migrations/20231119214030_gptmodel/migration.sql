/*
  Warnings:

  - You are about to drop the column `GPTModelUsed` on the `tokenSpent` table. All the data in the column will be lost.
  - You are about to drop the column `gpt` on the `tokenSpent` table. All the data in the column will be lost.
  - Added the required column `GPTModelId` to the `tokenSpent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tokenSpent" DROP COLUMN "GPTModelUsed",
DROP COLUMN "gpt",
ADD COLUMN     "GPTModelId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "tokenSpent" ADD CONSTRAINT "tokenSpent_GPTModelId_fkey" FOREIGN KEY ("GPTModelId") REFERENCES "tokenPricing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
