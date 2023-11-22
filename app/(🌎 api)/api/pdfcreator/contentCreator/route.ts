import { OpenAI } from "openai";
import { prisma } from "@/lib/prisma";
import languageString from "@/src/list/ai/languagesList";
import spendTokens from "@/src/function/ai/spendTokens";
import { getUserLog } from "@/src/query/user.query";
import { Lang } from "@/src/@types/ai-options/lang";
import { Length } from "@/src/@types/ai-options/length";
import { personalitiesValues } from "@/src/@types/ai-options/personality";
import { TonesValues } from "@/src/@types/ai-options/tone";
import { GPTModels } from "@/src/@types/ai-options/GPTModel";

const openai = new OpenAI({
  apiKey: process.env.API_KEY_GPT,
});

export const maxDuration = 300;

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing env var from OpenAI");
}

export async function POST(req: Request): Promise<Response> {
  const user = await getUserLog();
  if (!user) {
    return new Response("User not logged in", { status: 401 });
  }
  const {
    title,
    model,
    lang,
    pdfId,
    maxTokens,
    plan,
    personality,
    length,
    tone,
  } = (await req.json()) as {
    title?: string;
    pdfId: string;
    plan: [any];
    maxTokens: number;
    model: GPTModels;
    lang?: Lang;
    tone?: TonesValues;
    length?: Length;
    personality?: personalitiesValues;
  };

  // On récupère le planTitle de chaque item du plan et on le met dans une seule string
  const planTitle = plan.map((item) => item.planTitle).join("\n\n");
  //
  const language = languageString(lang ? lang : "en");

  if (!title) {
    return new Response("No prompt in the request", { status: 230 });
  }

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

  const promptSystem = `
  **Role and Goal**: As an expert in content creation for the PDF titled '${pdfOriginal?.title}', my task is to elaborate on the specific point '${title}'. I will provide in-depth, focused content without reintroducing the title.

**Personality and Style**: In line with the ${personality} personality, my writing is ${tone}. I engage readers with a detailed narrative and comprehensive explanations, emphasizing key concepts in *italics* and **bold**.

**Language and Format**: The content is in ${language} and strictly adheres to Markdown formatting. Key points and terms are highlighted in *italics* and **bold** for emphasis. No Markdown headers or titles are used.

**Content Creation Guidelines**:
- I provide substantial information directly related to '${title}', avoiding any repetition of the title.
- The content's depth aligns with the ${length} setting ('short', 'medium', 'long'), ensuring appropriate detail and complexity.

**Contextual Integration**:
- This content is an integral part of '${pdfOriginal?.title}', designed to enhance the overall narrative and understanding.

**Important Notes**:
- My writing, reflecting the ${personality} style, maintains a consistent ${tone} and focuses on substance.
- Directly engaging with '${title}', I offer valuable insights and detailed content that enriches the reader's experience.  
`;

  const promptUser = `
Create content for the topic '${title}' as part of our PDF plan. The content should be in ${language} STRICTLY, embodying the ${tone} tone and ${personality} style. Focus directly on the subject matter, highlighting key points in *italics* and **bold**. Avoid reiterating the title. Ensure the content is appropriate for the ${length} ('short', 'medium', 'long') and enriches the reader's understanding of '${title}'.
'.
`;

  // On appel le modèle
  const response = await openai.chat.completions.create({
    model: model,
    messages: [
      { role: "system", content: promptSystem },
      {
        role: "user",
        content: promptUser,
      },
    ],
    top_p: 0.7,
    frequency_penalty: 0.5,
    presence_penalty: 1,
    max_tokens: maxTokens,
    temperature: 1,
  });

  if (!response.choices[0].message.content || !response.usage) {
    return new Response("No content returned", { status: 400 });
  }
  // On dépense le nombre de tokens
  let totalTokens = 0;
  const inputToken = await spendTokens({
    tokenCount: response.usage.prompt_tokens,
    input: true,
    GPTModel: model,
  });
  const outputTokens = await spendTokens({
    tokenCount: response.usage.completion_tokens,
    output: true,
    GPTModel: model,
  });
  if (!inputToken || !outputTokens) {
    return new Response("Error spending tokens", { status: 400 });
  }
  totalTokens = outputTokens;
  if (!response.choices[0].message.content) {
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
    return new Response(
      JSON.stringify({
        id: pdfContent.id,
        planId: pdfContent.planId,
        planContent: pdfContent.planContent,
        tokenRemaining: totalTokens,
      }),
      { status: 200 }
    );
  } else {
    return new Response(JSON.stringify({ error: "Some error message" }), {
      status: 400,
    });
  }
}
