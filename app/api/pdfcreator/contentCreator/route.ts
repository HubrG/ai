import { OpenAI } from "openai";
import { prisma } from "@/lib/prisma";
import languageString from "@/src/function/ai/languages";
import spendTokens from "@/src/function/ai/spendTokens";
import { getUserLog } from "@/src/query/user.query";

const openai = new OpenAI({
  apiKey: process.env.API_KEY_GPT,
});

export const maxDuration = 300;

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing env var from OpenAI");
}

export async function POST(req: Request): Promise<Response> {
  if (!getUserLog()) {
    return new Response("User not logged in", { status: 401 });
  }
  const { title, model, lang, pdfId, maxTokens, plan } = (await req.json()) as {
    title?: string;
    pdfId: string;
    plan: [any];
    maxTokens: number;
    model: "gpt-3.5-turbo" | "gpt-4-1106-preview";
    // langues : french (fr), english (en), german (de), italian (it), spanish (es), portuguese (pt), russian (ru), swedish (sv), turkish (tr), chinese (zh), japanese (ja), korean (ko), indonesian (id), hindi (hi)
    lang?:
      | "fr"
      | "en"
      | "de"
      | "it"
      | "es"
      | "pt"
      | "ru"
      | "sv"
      | "tr"
      | "zh"
      | "ja"
      | "ko"
      | "id"
      | "hi";
  };

  // On récupère le planTitle de chaque item du plan et on le met dans une seule string
  const planTitle = plan.map((item) => item.planTitle).join("\n\n");
  // console.log(planTitle);
  // return new Response("ok", { status: 200 });
  // console.log("🚩  " + title + " Début du processus de génération du contenu.");
  //
  let promptSystem = "";
  const language = languageString(lang ? lang : "en");

  if (!title) {
    // console.log("⛔ Aucun prompt dans la requête");
    return new Response("No prompt in the request", { status: 230 });
  }

  if (!pdfId) {
    // console.log("⛔ Aucun pdfId dans la requête");
    return new Response("No pdfId found", { status: 400 });
  }

  // console.log("⚙️ " + title + " : vérification de la duplication du contenu");

  // On vérifie que le PDF content n'existe pas par rapport au planId
  const pdfContentExist = await prisma.pdfCreatorContent.findFirst({
    where: {
      planId: pdfId,
    },
  });

  if (pdfContentExist) {
    // console.log("⛔ " + title + " : contenu déjà existant");
    return new Response("Content already exist", { status: 400 });
  }

  // console.log("✅ " + title + " contenu non existant, on peut continuer");

  // console.log("⚙️ " + title + " : récupération de l'item du plan associé");
  // On récupère le plan
  const planOriginal = await prisma.pdfCreatorPlan.findUnique({
    where: {
      id: pdfId,
    },
  });

  if (!planOriginal) {
    // console.log("⛔ " + title + " : aucun plan trouvé");
    return new Response("No plan found", { status: 400 });
  }

  // console.log("✅ " + title + " : plan trouvé, on peut continuer");

  // console.log("⚙️ " + title + " : récupération du PDF associé au plan");
  // On récupère le PDF via planOriginal
  const pdfOriginal = await prisma.pdfCreator.findUnique({
    where: {
      id: planOriginal.pdfId,
    },
  });

  if (!pdfOriginal) {
    // console.log("⛔ " + title + " : aucun pdf trouvé");
    return new Response("No pdf found", { status: 400 });
  }

  // console.log("✅ " + title + " : pdf trouvé, on peut continuer");

  promptSystem = `
  I'm writing PDF about ${pdfOriginal?.title} in ${language} language. Here's the plan : \n\n ${planTitle}.
  I write one point of the plan at a time. I do not write the title of the point,
  I do not recall the title of the "about" in your response, I go straight to the point by typing the content.\n\n
  I format everything in markdown and I format important words in *italics* and **bold**. I, very important, also add links to external resources.\n\n
  I use all the figures of speech, metaphors, similes, etc. to make the content more engaging and interesting.\n\n
  `;

  // console.log("⚙️ " + title + " : appel de l'API GPT");
  // On appel le modèle
  const response = await openai.chat.completions.create({
    model: model,
    messages: [
      { role: "system", content: promptSystem },
      {
        role: "user",
        content: `Now, type the best content for this point of our plan in ${language} :  ${title}. No comment, straight to the point !\n\n`,
      },
    ],
    top_p: 0.7,
    frequency_penalty: 0.5,
    presence_penalty: 1,
    max_tokens: maxTokens,
    temperature: 1.2,
  });

  // console.log(response)

  if (!response.choices[0].message.content || !response.usage) {
    // console.log("⛔ " + title + " : aucun contenu retourné");
    return new Response("No content returned", { status: 400 });
  }
  // On dépense le nombre de tokens
  spendTokens({
    tokenCount: response.usage.prompt_tokens,
    input: true,
    GPTModel: model,
  });
  spendTokens({
    tokenCount: response.usage.completion_tokens,
    output: true,
    GPTModel: model,
  });

  // console.log(
  //   "✅ " + title + " : appel de l'API GPT terminé, on peut continuer"
  // );

  // console.log("⚙️ " + title + " : ajout en BDD du contenu");
  if (!response.choices[0].message.content) {
    // console.log("⛔ " + title + " : aucun contenu retourné");
    return new Response("No content returned", { status: 400 });
  }
  // On ajoute en BDD sur la table pdfCreatorContent
  const pdfContent = await prisma.pdfCreatorContent.create({
    data: {
      planId: pdfId,
      planContent: response.choices[0].message.content ?? "",
    },
  });

  if (pdfContent) {
    // console.log("🏁  " + title + " : contenu ajouté en BDD, terminé");
    return new Response(
      JSON.stringify({
        id: pdfContent.id,
        planId: pdfContent.planId,
        planContent: pdfContent.planContent,
      }),
      { status: 200 }
    );
  } else {
    // console.log("⛔ " + title + " : erreur lors de l'ajout du contenu en BDD");
    return new Response(JSON.stringify({ error: "Some error message" }), {
      status: 400,
    });
  }
}
