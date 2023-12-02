import { prisma } from "@/lib/prisma";

export const tokenRequired = async (featureName: string) => {
  const tokens = await prisma.tokenRequired.findFirst({
    where: {
      featureName: featureName,
    },
  });
  if (!tokens) {
    return new Response("Error finding token required", { status: 400 });
  }

  return tokens.minRequired;
};
