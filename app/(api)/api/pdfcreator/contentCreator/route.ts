import { OpenAIStream, OpenAIStreamPayload } from "@/lib/openAIStream";
import { OpenAI } from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.API_KEY_GPT,
});
export const config = {
  maxDuration: 300, // Durée maximale de 5 minutes
};

import languageString from "@/src/function/languages";
if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing env var from OpenAI");
}

export async function POST(req: Request): Promise<Response> {
  const { title, model, lang, pdfId } = (await req.json()) as {
    title?: string;
    pdfId: string;
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

  //
  let promptSystem = "";
  const language = languageString(lang ? lang : "en");

  if (!title) {
    return new Response("No prompt in the request", { status: 230 });
  }
  // Gestion du prompt

  // const payload: OpenAIStreamPayload = {
  //   model: model,
  //   messages: [
  //     {
  //       role: "system",
  //       content: promptSystem,
  //     },
  //     {
  //       role: "user",
  //       content: `Make a detailed point in ${language}, about :  ${title}`,
  //     },
  //   ],
  //   temperature: 0.7,
  //   top_p: 1,
  //   frequency_penalty: 0,
  //   presence_penalty: 0,
  //   max_tokens: 1000,
  //   stream: true,
  //   n: 1,
  // };

  if (!pdfId) {
    return new Response("No pdfId found", { status: 400 });
  }

  // On vérifie que le PDF content n'existe pas par rapport au planId
  const pdfContentExist = await prisma.pdfCreatorContent.findFirst({
    where: {
      planId: pdfId,
    },
  });

  if (pdfContentExist) {
    return new Response("Content already exist", { status: 400 });
  }
  // On ajoute en BDD sur la table pdfCreatorContent
  //  const createFirst =  await prisma.pdfCreatorContent.create({
  //   data: {
  //     planId: pdfId,
  //     planContent: "",
  //   },
  //  });

  //  if (!createFirst) {
  //    return new Response("Error", { status: 400 });
  //  }
  // On récupère le plan
  const planOriginal = await prisma.pdfCreatorPlan.findUnique({
    where: {
      id: pdfId,
    },
  });

  if (!planOriginal) {
    return new Response("No plan found", { status: 400 });
  }

  // On récupère le PDF via planOriginal
  const pdfOriginal = await prisma.pdfCreator.findUnique({
    where: {
      id: planOriginal.pdfId,
    },
  });

  if (!pdfOriginal) {
    return new Response("No pdf found", { status: 400 });
  }

  promptSystem = `
  On my PDF about ${pdfOriginal?.title}, I will make a detailed point in ${language} about this point :  ${title}
  `;

  // On appel le modèle
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: promptSystem },
      {
        role: "user",
        content: `Make a detailed point in ${language}, about :  ${title}`,
      },
    ],
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 100,
    temperature: 0.7,
  });

  // On ajoute en BDD sur la table pdfCreatorContent
  const pdfContent = await prisma.pdfCreatorContent.create({
    data: {
      planId: pdfId,
      planContent: response.choices[0].message.content ?? "",
    },
  });

  // const stream = await OpenAIStream(payload);
  // console.log(stream);
  if (pdfContent) {
    return new Response(
      JSON.stringify({ id: pdfContent.id, planId: pdfContent.planId, planContent: pdfContent.planContent }),
      { status: 200 }
    );
  } else {
    return new Response(JSON.stringify({ error: "Some error message" }), {
      status: 400,
    });
  }
}
