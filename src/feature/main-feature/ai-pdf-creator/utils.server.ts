"use server";
import { prisma } from "@/lib/prisma";
import { getUserLog } from "@/src/query/user.query";

export const createPdf = async (lang: string, subject: string) => {
  const user = await getUserLog();
  if (!user) {
    throw new Error("User not logged in");
  }
  const pdf = await prisma.pdfCreator.create({
    data: {
      userId: user.id,
      lang: lang,
      title: subject,
    },
  });
  if (!pdf) {
    throw new Error("Pdf not created");
  }
  return pdf;
};

export const createPdfPlan = async (titles: string[], pdfId: string) => {
  console.log(titles);
  const user = await getUserLog();
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

  const plans = await prisma.$transaction(
    titles.map((title) => {
      const match = title.match(/^(#+)\s/); // Capture les dièses au début du titre
      const planLevel = match ? match[1] : "Other"; // Utilise le nombre de dièses ou 'Other'

      if (planLevel === "#" && firstTitleForPdf === null) {
        firstTitleForPdf = title.replace(/^#\s/, "").trim();
      }

      return prisma.pdfCreatorPlan.create({
        data: {
          planTitle: title.replace(/^(#+\s)/, "").trim(),
          pdfId: pdfId,
          planLevel: planLevel,
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
  const user = await getUserLog();
  if (!user) {
    throw new Error("User not logged in");
  }
  const plan = await prisma.pdfCreator.delete({
    where: {
      userId: user.id,
      id: id,
    },
  });
};

export const updatePlan = async (id: string, title: string) => {
  const user = await getUserLog();
  if (!user) {
    throw new Error("User not logged in");
  }

  // On récupère le plan pour vérifier l'appartenance
  const plan = await prisma.pdfCreatorPlan.findUnique({
    where: {
      id: id,
    },
    include: {
      pdf: true, // Inclut les informations sur le pdfCreator associé
    },
  });

  // On vérifie que l'utilisateur est bien le propriétaire du pdfCreator associé au plan
  if (plan && plan.pdf.userId === user.id) {
    // Si c'est le cas, on met à jour le plan
    const updatedPlan = await prisma.pdfCreatorPlan.update({
      where: {
        id: id,
      },
      data: {
        planTitle: title,
      },
    });
    return updatedPlan;
  } else {
    throw new Error(
      "Plan not found or user does not have permission to update this plan."
    );
  }
};

export const updateContent = async (id: string, content: string) => {
  const user = await getUserLog();
  if (!user) {
    throw new Error("User not logged in");
  }

  // On récupère le contenu pour vérifier l'appartenance
  const contentToEdit = await prisma.pdfCreatorPlan.findUnique({
    where: {
      id: id,
    },
    include: {
      pdfCreatorContent: true,
      pdf: true,
    },
  });

  // On vérifie que l'utilisateur est bien le propriétaire du pdfCreator associé au contenu
  if (contentToEdit && contentToEdit.pdf.userId === user.id) {
    console.log("ok")
    // Si c'est le cas, on met à jour le contenu
    const updatedContent = await prisma.pdfCreatorContent.update({
      where: {
        id: contentToEdit.pdfCreatorContent[0].id,
      },
      data: {
        planContent: content,
      },
    });
    console.log(updatedContent)
    return updatedContent;
  } else {
    throw new Error(
      "Content not found or user does not have permission to update this content."
    );
  }
};

export const getPdfPlanAndContent = async (pdfId: string) => {
  const pdf = await prisma.pdfCreator.findUnique({
    where: {
      id: pdfId,
    },
    include: {
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
