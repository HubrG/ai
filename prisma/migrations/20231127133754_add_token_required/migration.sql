-- CreateTable
CREATE TABLE "tokenRequired" (
    "id" TEXT NOT NULL,
    "featureName" TEXT NOT NULL,
    "minRequired" INTEGER NOT NULL,

    CONSTRAINT "tokenRequired_pkey" PRIMARY KEY ("id")
);
