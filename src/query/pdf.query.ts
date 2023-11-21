import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export const getPdfs = async () => {
  const user = await getAuthSession();
  if (!user) {
    return null;
  }
  try {
    const pdf = await prisma.pdfCreator.findMany({
      where: {
        userId: user.user.id,
      },
    });
    if (!pdf) {
      return null;
    }
    //   console.log(pdf)
    return pdf;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return null;
  }
};
