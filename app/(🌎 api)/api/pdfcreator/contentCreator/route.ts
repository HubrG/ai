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
import { getModelId } from "@/src/query/gptModel.query";

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

  const promptSystem = `**Role and Goal**: As a content expert, I'll expand on '${title}' in the PDF '${pdfOriginal?.title}', providing detailed content without repeating the title.
\n**Personality and Style**: With a ${personality} personality and ${tone} tone, I'll engage readers using detailed narratives, highlighting key points in *italics* and **bold**.
\n**Language and Format**: Content in ${language}, adhering to Markdown formatting without headers or titles.
\n**Contextual Integration**:
- This content is an integral part of all parts, designed to enhance the overall narrative and understanding.
- Here, all the plan :
${plan}
**Guidelines**:
- Deliver insights related to '${title}' in depth as per the ${length} setting.
- Enhance narrative and understanding as part of the overall plan. 
**Notes**:
- Writing reflects a consistent ${tone} and ${personality} style, focusing on substance and offering valuable insights about '${title}'.
`;

  const promptUser = `Create content for the topic '${title}' as part of our PDF plan. The content should be in ${language} STRICTLY, embodying the ${tone} tone and ${personality} style. Focus directly on the subject matter, highlighting key points in *italics* and **bold**. Avoid reiterating the title. Ensure the content is appropriate for the ${length} ('short', 'medium', 'long') and enriches the reader's understanding of '${title}'.`;

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
    pdfId: planOriginal.pdfId,
  });
  const outputTokens = await spendTokens({
    tokenCount: response.usage.completion_tokens,
    output: true,
    GPTModel: model,
    pdfId: planOriginal.pdfId,
  });
  if (!inputToken || !outputTokens) {
    return new Response("Error spending tokens", { status: 400 });
  }
  totalTokens = outputTokens;
  if (!response.choices[0].message.content) {
    return new Response("No content returned", { status: 400 });
  }
  // On recherche le model ID de GPT
  const modelId = await getModelId(model);
  // On ajoute en BDD sur la table pdfCreatorContent
  const pdfContent = await prisma.pdfCreatorContent.create({
    data: {
      planId: pdfId,
      planContent: response.choices[0].message.content ?? "",
      lang: lang,
      gptModelId: modelId?.id,
      length: length,
      personality: personality,
      tone: tone,
      isSelected: true,
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