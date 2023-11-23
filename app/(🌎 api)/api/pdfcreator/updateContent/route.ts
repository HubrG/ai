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
  const Gpt = await getModelId(gptModel);

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
    const planId = await prisma.pdfCreatorPlan.findFirst({
      where: {
        OR: [{ id: id }, { idRef: id }],
        isSelected: true,
      },
    });
    if (!planId) {
      return new Response("Plan not found", { status: 404 });
    }
    const planTitle = planId.planTitle;
    // On créé le prompt
    promptSystem = `**Role and Goal**: As an AI content enhancer for the PDF titled '${subject}', my specific task is to refine the content detailed in '${value}'. This task involves enriching and clarifying the content, focusing solely on the substance without reintroducing or referencing the title '${planTitle}'.

    **Personality and Style**: Aligning with the ${personalityValue} personality, I will apply a ${toneValue} tone. The goal is to enrich the content with engaging and relevant details, emphasizing key points in *italics* and **bold** without repeating the title.
    
    **Language and Format**: The revisions will be in ${language}, maintaining Markdown formatting. Emphasis will be on improving the content's quality, not on its title.
    
    **Content Revision Guidelines**:
    - Focus exclusively on enhancing '${value}', avoiding any repetition or mention of the title '${planTitle}'.
    - The content’s depth and complexity should correspond with the ${length} setting, ensuring appropriate elaboration.
    
    **Contextual Consideration**:
    - The revised content must seamlessly fit within the overall context of the plan but should not reiterate the title.
    - Here's the complete plan for context:
    ${plan}
    
    **Important Notes**:
    - The aim is to improve '${value}' in terms of clarity and engagement, focusing on the content itself rather than its title.
    - The revision should offer in-depth insights and enhancements pertinent to the specific content, not the title.
    `;
    promptUser = `Please enhance the content section: '${value}'. The revision should strictly focus on the content itself, in ${language} (STRICTLY IN ${language}), and reflect a ${toneValue} tone and ${personalityValue} style. Aim to improve clarity and depth, using *italics* and **bold** for emphasis where appropriate. Avoid referencing or repeating the title '${planTitle}'. The focus should be on enriching the content within the context of the overall plan, '${subject}'.
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
      max_tokens: 100,
      temperature: 1,
    });
    console.log("response: ", response.choices[0].message.content);
    if (!response.choices[0].message.content) {
      return new Response("No response from OpenAI", { status: 400 });
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
        OR: [
          { planId: contentCreated.planId },
        ],
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

  return new Response(
    JSON.stringify({
      response: response.choices[0].message.content,
    }),
    { status: 200 }
  );
}
