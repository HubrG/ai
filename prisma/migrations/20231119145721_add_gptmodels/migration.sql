-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tokenRemaining" INTEGER NOT NULL DEFAULT 150000;

-- CreateTable
CREATE TABLE "tokenSpent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokenSpent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokenPricing" (
    "id" TEXT NOT NULL,
    "GPTModel" TEXT NOT NULL,
    "priceFor1kInput" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "priceFor1kOutput" DOUBLE PRECISION NOT NULL DEFAULT 0.03,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokenPricing_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tokenSpent" ADD CONSTRAINT "tokenSpent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
