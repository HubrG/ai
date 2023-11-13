import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getAuthSession } from "@/lib/auth";
import { User } from '@prisma/client';

export const getUserLog = async () => {
  const session = await getAuthSession();

  if (!session?.user.id) {
    return;
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: session.user.id,
    },
  });

  return user;
};

export const getUser = async (email?: string): Promise<User | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    return user;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return null;
  }
};


export type UserProfile = NonNullable<Prisma.PromiseReturnType<typeof getUserLog>>;
