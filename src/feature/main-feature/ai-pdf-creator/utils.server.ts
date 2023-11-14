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

  // Vérifier que le pdfId existe dans la table correspondante
  const pdfExists = await prisma.pdfCreator.findUnique({
    where: { id: pdfId },
  });
  if (!pdfExists) {
    throw new Error(`PDF with ID ${pdfId} does not exist.`);
  }

  
  // Utiliser une transaction pour faire tous les inserts
  const plans = await prisma.$transaction(
    titles.map((title) => 
      prisma.pdfCreatorPlan.create({
        data: {
          // On supprime le niveau
          planTitle: title.replace(/^(#+|-)/, "").trim(),
          pdfId: pdfId,
          // On récupère le niveau du plan: #, ##, ###, -, etc.
          planLevel: title.match(/^(#+|-)/)?.[0] || "#",
        },
        select: {
          id: true, // Assurez-vous de sélectionner l'ID
          planTitle: true,
          planLevel: true,
        },
      })
    )
  );
  
 

  return plans; // Renvoie les plans créés
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


