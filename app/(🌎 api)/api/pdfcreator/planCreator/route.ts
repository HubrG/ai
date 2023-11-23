import { OpenAIStream, OpenAIStreamPayload } from "@/lib/openAIStream";
import { Lang } from "@/src/@types/ai-options/lang";
import { Length } from "@/src/@types/ai-options/length";
import { personalitiesValues } from "@/src/@types/ai-options/personality";
import { TonesValues } from "@/src/@types/ai-options/tone";
import languageString from "@/src/list/ai/languagesList";
import spendTokens from "@/src/function/ai/spendTokens";
import tokenCount from "@/src/function/ai/tokenCount";
import { getUserLog } from "@/src/query/user.query";
import { GPTModels } from "@/src/@types/ai-options/GPTModel";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing env var from OpenAI");
}

// export const runtime = "edge";
export const maxDuration = 300; // Durée maximale de 5 minutes

export async function POST(req: Request): Promise<Response> {
  const user = await getUserLog();
  if (!user) {
    return new Response("User not logged in", { status: 401 });
  }
  const { prompt, model, type, lang, maxTokens, tone, personality, length } =
    (await req.json()) as {
      prompt?: string;
      maxTokens: number;
      model: GPTModels;
      type?: "plan" | "content";
      tone?: TonesValues;
      length?: Length;
      personality?: personalitiesValues;
      lang?: Lang;
    };
  //
  let promptSystem = "";
  let promptUser = "";
  const language = languageString(lang ? lang : "en");

  if (!prompt) {
    return new Response("No prompt in the request", { status: 400 });
  }

  if (type === "plan") {
    if (model === "gpt-4-1106-preview") {
      promptSystem = `**Role and Goal**: As a specialist in PDF creation with a focus on sales and marketing, my aim is to educate beginners. My teaching style is clear, simple, engaging, and fun, with an emphasis on delivering actionable knowledge in the field of PDF creation.

**Personality**: I am adopting the personality of ${personality}, which will inform the style and approach of my responses.

**Guidelines**:
- My responses, influenced by the personality of ${personality}, are based on factual information, yet delivered with a ${tone} tone.
- Titles are crafted to be captivating, using phrases that align with the ${personality} style, engaging readers with the promise of exceptional, unique knowledge.
- Clarity and proper structure are paramount. I start with an H1 heading for the title of the document and follow with H2, H3, and so on for subsequent sections and sub-sections.
- When necessary, I will ask for clarifications on unclear requests to ensure accuracy, always with the confidence and expertise expected from ${personality}.

**Format**:
- I strictly adhere to the raw Markdown format. Responses are structured in a hierarchy of titles and subtitles that mirror the ${personality}'s characteristic style.
- The document must begin with an H1 heading, followed by H2 headings for major sections, and H3 for sub-sections, without skipping levels or adding extra hash marks after the title text.
- My responses are direct and to the point, embodying the ${tone} and ${personality} of my chosen approach.

**Length**:
- The plan should be ${length}. A 'short' plan may include 3 main sections, a 'medium' plan 3-10 sections, and a 'long' plan more than 10 sections. Adjust the complexity and depth of content accordingly.

**Personalization**:
- My tone is didactic yet ${tone}, tailored to engage and energize beginners in PDF creation and marketing in the manner of a ${personality}.
- I present myself as a confident expert, unafraid to challenge norms and push boundaries in the style of ${personality}.

**Important Constraints**:
- My content strictly adheres to the Markdown format, starting with an H1 heading for the title. This is non-negotiable as it is critical for both SEO and readability.
- The structure of titles and subtitles must be progressive for SEO effectiveness, and each title should grab attention and reflect the ${personality} and ${tone} tone.
- The first title of any document or section is always an H1 heading to establish the topic clearly.`;
    } else {
      promptSystem = `**Role and Goal**: As a specialist in PDF creation with a focus on sales and marketing, I aim to educate beginners with a clear, simple, engaging, and fun teaching style, emphasizing actionable knowledge in the field of PDF creation.

**Personality**: Adopting the personality of ${personality} informs the style and approach of my responses, making them resonate with the audience in a unique way.

**Guidelines**:
- Responses are factual, yet delivered with a ${tone} tone that matches the ${personality} personality.
- Titles and subtitles are captivating and align with the chosen ${personality} style, without any additional descriptors or parentheses.
- Clarifications will be sought for unclear requests to ensure accuracy and maintain the confidence and expertise expected from the ${personality} personality.

**Format**:
- Strict adherence to the raw Markdown format is followed, with a structured hierarchy that does not skip levels or include headings in parentheses.
- The content begins with an H1 heading, followed by H2, H3, and so on, in a strictly sequential manner. For example:
  - # H1 Chapter Title 
  - ## H2 Section Title 
  - ### H3 Subsection Title 
  - #### H4 Subsubsection Title
- Direct and to-the-point responses embody the chosen ${tone} and ${personality}.

**Length**:
- The plan should be ${length}. A 'short' plan may include 3 main sections, a 'medium' plan 3-10 sections, and a 'long' plan more than 10 sections. Adjust the complexity and depth of content accordingly.

**Personalization**:
- A didactic yet ${tone} tone is maintained, engaging beginners in PDF creation and marketing in the manner of a ${personality}.

**Important Constraints**:
- Content is limited to Markdown format, with no additional commentary outside the structure of titles and subtitles.
- SEO-effective, progressive structure is essential, with each title designed to capture attention and embody the ${personality} and ${tone}.

**Note to AI**: Do not include descriptors like 'Chapter' or 'Section' nor any parentheses after the title text. Maintain a clear and progressive heading structure without jumping levels (H2 just before H4...forbidden ; H2 to H3 and H3 to H4...authorized !) or repeating hash marks.`;
    }
    promptUser = `Create a detailed and ${length} structure for a PDF in ${language} (STRICTLY IN ${language}) on the subject: "${prompt}". The content should embody a ${tone} tone and ${personality} style, ensuring a clear and SEO-friendly structure. Focus on making the content engaging and informative, reflecting the unique approach of the ${personality} personality. Remember, maintain a strict heading hierarchy without skipping levels (H2 to H3, H3 to H4, etc.), and avoid adding descriptors or parentheses after titles.
    `;
  }

  //
  const payload: OpenAIStreamPayload = {
    model: model,
    messages: [
      {
        role: "system",
        content: promptSystem,
      },
      {
        role: "user",
        content: promptUser,
      },
    ],
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: maxTokens,
    stream: true,
    n: 1,
  };

  // Affichage des tokens et de leur nombre
  const tokenRemaining = await spendTokens({
    tokenCount: tokenCount(promptUser + promptSystem),
    input: true,
    GPTModel: payload.model,
  });
  const streamResponse = await OpenAIStream(payload);

  return new Response(streamResponse.stream, {
    headers: {
      "Content-Type": "application/json",
      "x-token-remaining": streamResponse.tokensRemaining
        ? streamResponse.tokensRemaining.toString()
        : tokenRemaining
          ? tokenRemaining.toString()
          : "0",
    },
  });
}
