"use server";
import { prisma } from "@/lib/prisma";

export async function getTotalTokensForPdf(pdfId: string) {
  const tokensOnPdf = await prisma.tokenSpentOnPdf.findMany({
    where: {
      pdfId: pdfId,
    },
    include: {
      token: true,
      pdf: true,
    },
  });
  if (!tokensOnPdf) {
    return 0;
  }
  return tokensOnPdf;
}
