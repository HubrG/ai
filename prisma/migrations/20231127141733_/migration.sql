/*
  Warnings:

  - A unique constraint covering the columns `[featureName]` on the table `tokenRequired` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "tokenRequired_featureName_key" ON "tokenRequired"("featureName");
