import { getUserLog } from "@/src/query/user.query";
import { prisma } from "@/lib/prisma";

type spendTokensProps = {
  tokenCount: number;
  input?: boolean;
  output?: boolean;
  GPTModel?: string;
  pdfId?: string;
};
export default async function spendTokens({
  tokenCount = 0,
  input = false,
  output = false,
  GPTModel = "gpt-3.5-turbo",
  pdfId = "",
}: spendTokensProps) {
  const user = await getUserLog();
  if (!user) return;
  // On recherche le model de GPT utilisé
  const gpt = await prisma.tokenPricing.findFirst({
    where: {
      GPTModel: GPTModel,
    },
  });
  if (!gpt) return;

  // On fait le calcul du coût de la requête (sachant que le prix est pur 1000 tokens)
  const cost = tokenCount / 1000;
  const costInput = gpt.priceFor1kInput * cost;
  const costOutput = gpt.priceFor1kOutput * cost;

  // On ajoute les tokens au tokenSpent de prisma
  const tokenSpentData = {
    token: tokenCount,
    input: input,
    output: output,
    cost: input ? costInput : costOutput,
    user: {
      connect: {
        id: user.id,
      },
    },
    GPTModel: {
      connect: {
        id: gpt.id,
      },
    },
  };

  const tokenSpent = await prisma.tokenSpent.create({
    data: tokenSpentData,
  });

  if (!tokenSpent) return;

  if (pdfId) {
    const tokenSpentOnPdf = await prisma.tokenSpentOnPdf.create({
      data: {
        token: {
          connect: { id: tokenSpent.id },
        },
        pdf: {
          connect: { id: pdfId },
        },
      },
    });
    if (!tokenSpentOnPdf) {
      console.log("Failed to create tokenSpentOnPdf entry");
      return;
    }
  }

  // On retire les tokens au user
  const userUpdate = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      tokenRemaining: {
        decrement: tokenCount,
      },
    },
  });
  if (!userUpdate) return;

  // On retourne le nombre de tokens restant
  return user.tokenRemaining - tokenCount;
}
