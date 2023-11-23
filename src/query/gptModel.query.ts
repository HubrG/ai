import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { tokenPricing } from "@prisma/client";

export const getModelId = async (gptModel: string) => {
  const session = await getAuthSession();

  if (!session?.user.id) {
    return;
  }

  

  const model = await prisma.tokenPricing.findFirst({
    where: {
      GPTModel: gptModel,
    },
    orderBy: {
      createdAt: "desc", // Tri par 'createdAt' du plus récent au plus ancien
    },
    select: {
      id: true,
    },
  });

  return model;
};

