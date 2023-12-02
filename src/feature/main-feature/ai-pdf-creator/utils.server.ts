"use server";
import { prisma } from "@/lib/prisma";
import { getModelId } from "@/src/query/gptModel.query";
import { getUserLog, getUserLogId } from "@/src/query/user.query";
import { User } from "@prisma/client";

type createPdfProps = {
  lang: string;
  subject: string;
  user?: User;
};
export const createPdf = async ({ lang, subject, user }: createPdfProps) => {
  let userLog;
  if (!user) {
    userLog = await getUserLog();
  } else {
    userLog = user;
  }
  if (!userLog) {
    throw new Error("User not logged in");
  }
  // On recherche la première occurrence du modèle GPT-3
  const model = await getModelId("gpt-3.5-turbo");
  if (!model) {
    throw new Error("Model not found");
  }
  const pdf = await prisma.pdfCreator.create({
    data: {
      userId: userLog.id,
      lang: lang,
      title: subject,
      gptModelId: model.id,
    },
  });
  if (!pdf) {
    throw new Error("Pdf not created");
  }
  return pdf;
};

export const createPdfPlan = async (
  titles: string[],
  pdfId: string,
  gptModel: string,
  selectedLanguage: string,
  selectedLength: string,
  selectedPersonality: string,
  selectedTone: string
) => {
  console.log(titles);
  const user = await getUserLogId();
  if (!user) {
    throw new Error("User not logged in");
  }

  const pdfExists = await prisma.pdfCreator.findUnique({
    where: { id: pdfId },
  });
  if (!pdfExists) {
    throw new Error(`PDF with ID ${pdfId} does not exist.`);
  }

  let firstTitleForPdf: string | null = null;
  const model = await getModelId(gptModel);

  const plans = await prisma.$transaction(
    titles.map((title) => {
      const match = title.match(/^(#+)\s/); // Capture les dièses au début du titre
      const planLevel = match ? match[1] : "Other"; // Utilise le nombre de dièses ou 'Other'

      if (planLevel === "#" && firstTitleForPdf === null) {
        firstTitleForPdf = title.replace(/^#\s/, "").trim();
      }
      // On recherche le model ID de GPT

      return prisma.pdfCreatorPlan.create({
        data: {
          planTitle: title.replace(/^(#+\s)/, "").trim(),
          pdfId: pdfId,
          planLevel: planLevel,
          gptModelId: model?.id,
          lang: selectedLanguage,
          length: selectedLength,
          personality: selectedPersonality,
          tone: selectedTone,
        },
        select: {
          id: true,
          planTitle: true,
          planLevel: true,
        },
      });
    })
  );

  if (firstTitleForPdf) {
    await prisma.pdfCreator.update({
      where: {
        id: pdfId,
      },
      data: {
        title: firstTitleForPdf,
      },
    });
  }

  return plans;
};

export const deletePlan = async (id: string) => {
  const user = await getUserLogId();
  if (!user) {
    throw new Error("User not logged in");
  }
  const plan = await prisma.pdfCreatorPlan.deleteMany({
    where: {
      pdfId: id,
      pdf: {
        userId: user.id,
      },
    },
  });
  if (!plan) {
    throw new Error("Plan not found");
  }
  return plan;
};

export const updatePlan = async (id: string, title: string) => {
  const user = await getUserLogId();
  if (!user) {
    throw new Error("User not logged in");
  }

  // On vérifie que l'utilisateur est bien le propriétaire du pdfCreator associé au contenu
  const titleToUpdate = await prisma.pdfCreatorPlan.update({
    where: {
      id: id,
      // On vérifie que l'utilisateur est bien le propriétaire du pdfCreator associé au contenu
      pdf: {
        userId: user.id,
      },
    },
    data: {
      planTitle: title,
      updatedAt: new Date(),
    },
  });
  if (!titleToUpdate) {
    throw new Error(
      "Plan not found or user does not have permission to update this content."
    );
  }
  // On modifie l'update du pdfCreator
  const pdfUpdate = await prisma.pdfCreator.update({
    where: {
      id: titleToUpdate.pdfId,
    },
    data: {
      updatedAt: new Date(),
    },
  });
  if (!pdfUpdate) {
    throw new Error("Pdf not found");
  }
  if (titleToUpdate) {
    return titleToUpdate;
  } else {
    throw new Error(
      "Plan not found or user does not have permission to update this content."
    );
  }
};

export const updateContent = async (id: string, content: string) => {
  const user = await getUserLogId();
  if (!user) {
    throw new Error("User not logged in");
  }

  // On vérifie que l'utilisateur est bien le propriétaire du pdfCreator associé au contenu
  const contentToUpdate = await prisma.pdfCreatorContent.update({
    where: {
      id: id,
      // On vérifie que l'utilisateur est bien le propriétaire du pdfCreator associé au contenu
      pdfCreatorPlan: {
        pdf: {
          userId: user.id,
        },
      },
    },
    data: {
      planContent: content,
      updatedAt: new Date(),
    },
    include: {
      pdfCreatorPlan: true,
    },
  });
  if (!contentToUpdate) {
    throw new Error(
      "Content not found or user does not have permission to update this content."
    );
  }
  // On modifie l'update du pdfCreator
  const pdfUpdate = await prisma.pdfCreator.update({
    where: {
      id: contentToUpdate.pdfCreatorPlan.pdfId,
    },
    data: {
      updatedAt: new Date(),
    },
  });
  if (!pdfUpdate) {
    throw new Error("Pdf not found");
  }
  if (contentToUpdate) {
    return contentToUpdate;
  } else {
    throw new Error(
      "Content not found or user does not have permission to update this content."
    );
  }
};

export const getPdfPlanAndContent = async (pdfId: string) => {
  const user = await getUserLogId();
  if (!user) {
    throw new Error("User not logged in");
  }
  const pdfBase = await prisma.pdfCreator.findUnique({
    where: {
      id: pdfId,
    },
  });
  if (!pdfBase) {
    throw new Error("Pdf not found");
  }
  const pdf = await prisma.pdfCreator.findUnique({
    where: {
      id: pdfId,
    },
    include: {
      gptModel: pdfBase.gptModelId ? true : false,
      pdfPlan: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          pdfCreatorContent: true,
        },
      },
    },
  });
  if (!pdf) {
    throw new Error("Pdf not found");
  }
  return pdf;
};

export const retrieveTokenRemaining = async () => {
  const user = await getUserLogId();
  if (!user) {
    throw new Error("User not logged in");
  }
  const tokenRemaining = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      tokenRemaining: true,
    },
  });
  if (!tokenRemaining) {
    throw new Error("Token remaining not found");
  }
  return tokenRemaining;
};

export const getPdf = async (id: string) => {
  const pdf = await prisma.pdfCreator.findUnique({
    where: {
      id: id,
    },
  });
  if (!pdf) {
    return false;
  }
  return pdf;
};
export const updatePdfSettings = async (
  id: string,
  lang: string,
  tone: string,
  personality: string,
  length: string,
  subject: string,
  activateAutomaticContent: boolean,
  GPTModel: string
) => {
  const user = await getUserLogId();
  if (!user) {
    throw new Error("User not logged in");
  }
  const modelId = await getModelId(GPTModel);
  if (!modelId) {
    return false;
  }
  const pdf = await prisma.pdfCreator.update({
    where: {
      id: id,
    },
    data: {
      length: length,
      personality: personality,
      tone: tone,
      lang: lang,
      subject: subject,
      automaticContent: activateAutomaticContent,
      gptModelId: modelId?.id,
    },
  });
  if (!pdf) {
    throw new Error("Pdf not found");
  }
  return pdf;
};

export const updatePlanIsSelected = async (id: string, idRef: string) => {
  const user = await getUserLogId();
  if (!user) {
    throw new Error("User not logged in");
  }

  const planSelected = await prisma.pdfCreatorPlan.update({
    where: {
      id: id,
    },
    data: {
      isSelected: true,
    },
  });
  if (!planSelected) {
    throw new Error("Plan not found");
  }
  // On passe tout en false, sauf le plan sélectionné
  const plansUpdated = await prisma.pdfCreatorPlan.updateMany({
    where: {
      OR: [{ id: idRef }, { idRef: idRef ? idRef : id }],
      NOT: {
        id: planSelected.id,
      },
    },
    data: {
      isSelected: false,
    },
  });
  if (!plansUpdated) {
    throw new Error("Plan not found");
  }

  return planSelected;
};

export const updateContentIsSelected = async (id: string, planId: string) => {
  // On met à jour le contenu sélectionné et on met en false tous les autres
  const contentSelected = await prisma.pdfCreatorContent.update({
    where: {
      id: id,
    },
    data: {
      isSelected: true,
    },
  });
  if (!contentSelected) {
    throw new Error("Content not found");
  }
  // On passe tout en false, sauf le contenu sélectionné
  const contentsUpdated = await prisma.pdfCreatorContent.updateMany({
    where: {
      planId: contentSelected.planId,
      NOT: {
        id: contentSelected.id,
      },
    },
    data: {
      isSelected: false,
    },
  });
  if (!contentsUpdated) {
    throw new Error("Content not found");
  }
  return contentSelected;
};

export const deletePdf = async (id: string) => {
  const user = await getUserLogId();
  if (!user) {
    throw new Error("User not logged in");
  }
  const pdf = await prisma.pdfCreator.deleteMany({
    where: {
      OR: [
        {
          // Supprimer le pdfCreator spécifique de l'utilisateur connecté
          id: id,
          userId: user.id,
        },
        {
          // Supprimer les pdfCreators qui n'ont aucun pdfCreatorPlan
          userId: user.id,
          pdfPlan: {
            none: {},
          },
        },
      ],
    },
  });
  if (!pdf) {
    throw new Error("Pdf not found");
  }
  return true;
};

export const getUserTokenRemaining = async () => {
  const user = await getUserLogId();
  if (!user) {
    throw new Error("User not logged in");
  }
  const tokenRemaining = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      tokenRemaining: true,
    },
  });
  if (!tokenRemaining) {
    throw new Error("Token remaining not found");
  }
  return tokenRemaining;
};

export const getTokenRequired = async () => {
  const tokenRequired = await prisma.tokenRequired.findMany();
  if (!tokenRequired) {
    throw new Error("Token required not found");
  }
  return tokenRequired;
};
