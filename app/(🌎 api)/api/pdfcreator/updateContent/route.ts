import { prisma } from "@/lib/prisma";
import { GPTModels } from "@/src/@types/ai-options/GPTModel";
import { Lang } from "@/src/@types/ai-options/lang";
import { Length } from "@/src/@types/ai-options/length";
import { personalitiesValues } from "@/src/@types/ai-options/personality";
import { TonesValues } from "@/src/@types/ai-options/tone";
import spendTokens from "@/src/function/ai/spendTokens";
import languageString from "@/src/list/ai/languagesList";
import { getModelId } from "@/src/query/gptModel.query";
import { getUserLog } from "@/src/query/user.query";
import { OpenAI } from "openai";
import { tokenRequired } from "../../../../../src/function/ai/tokenRequired";

const openai = new OpenAI({
  apiKey: process.env.API_KEY_GPT,
});
if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing env var from OpenAI");
}
export const maxDuration = 300;

export async function POST(req: Request): Promise<Response> {
  const user = await getUserLog();
  if (!user) {
    return new Response("User not logged in", { status: 401 });
  }

  const {
    type,
    value,
    lang,
    gptModel,
    toneValue,
    personalityValue,
    plan,
    id,
    subject,
    length,
    pdfId,
    planLevel,
    idRef,
    maxTokens,
  } = (await req.json()) as {
    type: "plan" | "content";
    value: string;
    lang?: Lang;
    gptModel: GPTModels;
    toneValue: TonesValues;
    personalityValue: personalitiesValues;
    plan: string;
    id: string;
    subject: string;
    length?: Length;
    pdfId: string;
    planLevel: string;
    idRef: string | undefined;
    maxTokens: number;
  };
  // SECTION --> Token required
  const tokenReqPlan = await tokenRequired("pdf-refresh-plan");
  const tokenReqContent = await tokenRequired("pdf-refresh-content");
  if (!tokenReqPlan || !tokenReqContent) {
    return new Response("Token required", { status: 402 });
  }
  if (typeof tokenReqPlan !== "number" || typeof tokenReqContent !== "number") {
    return new Response("Error retrieving token requirements", { status: 500 });
  }
  if (
    (type == "plan" && tokenReqPlan >= user.tokenRemaining) ||
    (type == "content" && tokenReqContent >= user.tokenRemaining)
  ) {
    return new Response("Not enough tokens", { status: 402 });
  }
  // SECTION // End
  const Gpt = await getModelId(gptModel);


  const language = languageString(lang ? lang : "en");
  let promptSystem;
  let promptUser;
  if (type === "plan") {
    promptSystem = `
    **Role and Goal**: As a content creation specialist for the PDF titled '${subject}', my objective is to expand on the selected plan point '${value}'. My approach is to provide detailed, focused insights without repeating the title.

    **Personality and Style**: Consistent with the ${personalityValue} personality, my narrative style is ${toneValue}. I aim to captivate the audience with thorough explanations and engaging narratives, accentuating essential ideas in *italics* and **bold**.
    
    **Language and Format**: The content is crafted in ${language}, strictly adhering to Markdown formatting. Key concepts and terms are emphasized in *italics* and **bold**. Markdown headers or titles are not included.
    
    **Content Creation Guidelines**:
    - I will deliver substantial insights specifically relevant to '${value}', ensuring no repetition of the title.
    - The content’s depth corresponds with the ${length} setting ('short', 'medium', 'long'), providing the right level of detail and intricacy.
    
    **Contextual Integration**:
    - This content is a seamless part of the entire plan, aiming to augment the overall narrative and comprehension.
    - Here is the complete plan:
    ${plan}
    
    **Important Notes**:
    - My composition, in line with the ${personalityValue} style, consistently maintains a ${toneValue} tone, prioritizing substance.
    - By directly addressing '${value}', I strive to present valuable perspectives and in-depth content that enhances the reader’s engagement.`;

    promptUser = `
    Please revise the just this title, short title, just the title (no development) : « '${value}'», as it currently does not meet my expectations. The revised title should be strictly in ${language}, reflecting the ${toneValue} tone and ${personalityValue} style. Focus directly on the core subject, highlighting critical elements in *italics* and **bold**. Remember to avoid repeating the original title.'.
`;
  } else {
    const planId = await prisma.pdfCreatorPlan.findFirst({
      where: {
        OR: [{ id: id }, { idRef: id }],
        isSelected: true,
        pdf: {
          userId: user.id,
        },
      },
    });
    if (!planId) {
      return new Response("Plan not found", { status: 404 });
    }
    const planTitle = planId.planTitle;
    // On créé le prompt
    promptSystem = `**Role and Goal**: As an expert in content creation for the PDF titled '${subject}', my task is to elaborate on the specific point '${planTitle}'. I will provide in-depth, focused content without reintroducing the title.

    **Personality and Style**: In line with the ${personalityValue} personality, my writing is ${toneValue}. I engage readers with a detailed narrative and comprehensive explanations, emphasizing key concepts in *italics* and **bold**.
    
    **Language and Format**: The content is in ${language} and strictly adheres to Markdown formatting. Key points and terms are highlighted in *italics* and **bold** for emphasis. No Markdown headers or titles are used.
    
    **Content Creation Guidelines**:
    - I provide substantial information directly related to '${planTitle}', avoiding any repetition of the title.
    - The content's depth aligns with the ${length} setting ('short', 'medium', 'long'), ensuring appropriate detail and complexity.
    
    **Contextual Integration**:
    - This content is an integral part of all parts, designed to enhance the overall narrative and understanding.
    - Here, all the plan :
    ${planTitle}
    
    **Important Notes**:
    - My writing, reflecting the ${personalityValue} style, maintains a consistent ${toneValue} and focuses on substance.
    - Directly engaging with '${planTitle}', I offer valuable insights and detailed content that enriches the reader's experience.  
    `;
    promptUser = `
    Create content for the topic '${planTitle}' as part of our PDF plan. The content should be in ${language} STRICTLY, embodying the ${toneValue} tone and ${personalityValue} style. Focus directly on the subject matter, highlighting key points in *italics* and **bold**. Avoid reiterating the title. Ensure the content is appropriate for the ${length} ('short', 'medium', 'long') and enriches the reader's understanding of '${planTitle}'.
    `;
    const response = await openai.chat.completions.create({
      model: gptModel,
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
      return new Response("No response from OpenAI", { status: 400 });
    }

    // On dépense le nombre de tokens
    let totalTokens = 0;
    const inputToken = await spendTokens({
      tokenCount: response.usage.prompt_tokens,
      input: true,
      GPTModel: gptModel,
      pdfId: pdfId,
    });
    const outputTokens = await spendTokens({
      tokenCount: response.usage.completion_tokens,
      output: true,
      GPTModel: gptModel,
      pdfId: pdfId,
    });
    if (!inputToken || !outputTokens) {
      return new Response("Error spending tokens", { status: 400 });
    }
    totalTokens = outputTokens;
    if (!response.choices[0].message.content) {
      return new Response("No content returned", { status: 400 });
    }

    // On ajoute le contenu dans la BDD (pdfCreatorContent) (sans update)
    const contentCreated = await prisma.pdfCreatorContent.create({
      data: {
        planContent: response.choices[0].message.content,
        planId: planId.idRef ? planId.idRef : planId.id,
        lang: lang,
        gptModelId: Gpt?.id,
        length: length,
        personality: personalityValue,
        tone: toneValue,
        isSelected: true,
      },
    });

    if (!contentCreated) {
      return new Response("Content not created", { status: 400 });
    }
    // On met en false les contenus précédent, sauf celui qui vient d'être créé
    const contentUpdated = await prisma.pdfCreatorContent.updateMany({
      where: {
        OR: [{ planId: contentCreated.planId }],
        NOT: {
          id: contentCreated.id,
        },
      },
      data: {
        isSelected: false,
      },
    });
    if (!contentUpdated) {
      return new Response("Content not updated", { status: 400 });
    }
    return new Response(
      JSON.stringify({
        response: response.choices[0].message.content,
      }),
      { status: 200 }
    );
  }

  const response = await openai.chat.completions.create({
    model: gptModel,
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
    max_tokens: 1000,
    temperature: 1,
  });

  if (!response.choices[0].message.content) {
    return new Response("No response from OpenAI", { status: 400 });
  }

  if (type === "plan") {
    const planId = await prisma.pdfCreatorPlan.findUnique({
      where: {
        id: id,
        pdf: {
          userId: user.id,
        },
      },
      select: {
        idRef: true,
      },
    });
    if (!planId) {
      return new Response("Plan not found", { status: 404 });
    }
    if (!Gpt) {
      return new Response("GPT Model not found", { status: 404 });
    }
    const planCreated = await prisma.pdfCreatorPlan.create({
      data: {
        planTitle: response.choices[0].message.content,
        pdfId: pdfId,
        planLevel: planLevel,
        gptModelId: Gpt?.id,
        lang: lang,
        length: length,
        personality: personalityValue,
        tone: toneValue,
        idRef: idRef ? idRef : id,
        isSelected: true,
      },
    });
    if (!planCreated) {
      return new Response("Plan not created", { status: 400 });
    }
    // On met en false le plan précédent
    const planUpdated = await prisma.pdfCreatorPlan.updateMany({
      where: {
        OR: [
          { id: planCreated.idRef },
          { idRef: planCreated.idRef },
          { idRef: planCreated.id },
        ],
        NOT: {
          id: planCreated.id,
        },
      },
      data: {
        isSelected: false,
      },
    });
    if (!planUpdated) {
      return new Response("Plan not updated", { status: 400 });
    }
  } else {
    console.log(
      "response.choices[0].message.content",
      response.choices[0].message.content
    );
  }
  if (!response.choices[0].message.content || !response.usage) {
    return new Response("No response from OpenAI", { status: 400 });
  }

  // On dépense le nombre de tokens
  let totalTokens = 0;
  const inputToken = await spendTokens({
    tokenCount: response.usage.prompt_tokens,
    input: true,
    GPTModel: gptModel,
    pdfId: pdfId,
  });
  const outputTokens = await spendTokens({
    tokenCount: response.usage.completion_tokens,
    output: true,
    GPTModel: gptModel,
    pdfId: pdfId,
  });
  if (!inputToken || !outputTokens) {
    return new Response("Error spending tokens", { status: 400 });
  }
  totalTokens = outputTokens;
  if (!response.choices[0].message.content) {
    return new Response("No content returned", { status: 400 });
  }
  return new Response(
    JSON.stringify({
      response: response.choices[0].message.content,
    }),
    { status: 200 }
  );
}
