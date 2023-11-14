-- CreateTable
CREATE TABLE "pdfCreator" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pdfCreator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdfCreatorPlan" (
    "id" TEXT NOT NULL,
    "pdfId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "planTitle" TEXT NOT NULL,

    CONSTRAINT "pdfCreatorPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdfCreatorContent" (
    "id" TEXT NOT NULL,
    "planContent" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pdfCreatorContent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pdfCreator" ADD CONSTRAINT "pdfCreator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdfCreatorPlan" ADD CONSTRAINT "pdfCreatorPlan_pdfId_fkey" FOREIGN KEY ("pdfId") REFERENCES "pdfCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdfCreatorContent" ADD CONSTRAINT "pdfCreatorContent_planId_fkey" FOREIGN KEY ("planId") REFERENCES "pdfCreatorPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
