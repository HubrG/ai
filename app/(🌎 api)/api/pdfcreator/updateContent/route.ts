import { prisma } from "@/lib/prisma";
import { GPTModels } from "@/src/@types/ai-options/GPTModel";
import { Lang } from "@/src/@types/ai-options/lang";
import { Length } from "@/src/@types/ai-options/length";
import { personalitiesValues } from "@/src/@types/ai-options/personality";
import { TonesValues } from "@/src/@types/ai-options/tone";
import languageString from "@/src/list/ai/languagesList";
import { getModelId } from "@/src/query/gptModel.query";
import { getUserLog } from "@/src/query/user.query";
import { OpenAI } from "openai";

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
  };

  if (type == "content") {
    // On recherche le titre du contenu
  }

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
    - By directly addressing '${value}', I strive to present valuable perspectives and in-depth content that enhances the reader’s engagement.
     
`;

    promptUser = `
    Please revise the just this title, short title, just the title (no development) : « '${value}'», as it currently does not meet my expectations. The revised title should be strictly in ${language}, reflecting the ${toneValue} tone and ${personalityValue} style. Focus directly on the core subject, highlighting critical elements in *italics* and **bold**. Remember to avoid repeating the original title.'.
`;
  } else {
    promptSystem = ``;
    promptUser = ``;
  }
  console.log(pdfId);
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
  // On recheche l'IDref du plan
  const planId = await prisma.pdfCreatorPlan.findUnique({
    where: {
      id: id,
    },
    select: {
      idRef: true,
    },
  });
  if (!planId) {
    return new Response("Plan not found", { status: 404 });
  }
  const Gpt = await getModelId(gptModel);
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
        { idRef: planCreated.id }
      ],
      NOT: {
        id: planCreated.id
      }
    },
    data: {
      isSelected: false,
    },
  });
  if (!planUpdated) {
    return new Response("Plan not updated", { status: 400 });
  }

  return new Response(
    JSON.stringify({
      response: response.choices[0].message.content,
    }),
    { status: 200 }
  );
}
