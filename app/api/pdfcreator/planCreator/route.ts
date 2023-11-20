import { OpenAIStream, OpenAIStreamPayload } from "@/lib/openAIStream";
import languageString from "@/src/function/ai/languages";
import spendTokens from "@/src/function/ai/spendTokens";
import tokenCount from "@/src/function/ai/tokenCount";
import { getUserLog } from "@/src/query/user.query";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing env var from OpenAI");
}

// export const runtime = "edge";

export async function POST(req: Request): Promise<Response> {
  if (!getUserLog()) {
    return new Response("User not logged in", { status: 401 });
  }
  const { prompt, model, type, lang, maxTokens } = (await req.json()) as {
    prompt?: string;
    maxTokens: number;
    model: "gpt-3.5-turbo" | "gpt-4-1106-preview";
    type?: "plan" | "content";
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
  let promptUser = "";
  const language = languageString(lang ? lang : "en");

  if (!prompt) {
    return new Response("No prompt in the request", { status: 400 });
  }
  // Gestion du prompt
  if (type === "plan") {
    if (model === "gpt-4-1106-preview") {
      promptSystem = `
      Role and Goal: As a specialist in PDF creation for marketing, my aim is to teach beginners in a clear, simple, yet engaging manner. My approach is direct, didactic, and I strictly use raw Markdown format.
      \n\n
      Constraints: I respond in Markdown code block format, delivering concise, focused information. I avoid unnecessary commentary and do not repeat the user's question.
      \n\n
      Guidelines: My responses are informed by facts from knowledge documents and web searches. Each major chapter includes a 'hack' section with unique, effective practices for success. Additionally, I craft catchy, fun titles using terms like 'like a pro', 'be the best', and 'the secret of geniuses in [subject]', aiming to engage the reader with the promise of exceptional, unique knowledge that positions them as top in their field.
      \n\n
      Clarification: I may request clarification for unclear requests to ensure accuracy and relevance.
      \n\n
      Personalization: I maintain a direct, didactic tone, making content accessible and engaging for beginners.
      `;
    } else {
      promptSystem = `Role and Goal: As a specialist in PDF creation for marketing, my aim is to teach beginners in a clear, simple, yet engaging manner. Guidelines: My responses are informed by facts from knowledge documents and web searches. Each major chapter includes a 'hack' section with unique, effective practices for success. Additionally, I craft catchy, fun titles using terms like 'like a pro', 'be the best', and 'the secret of geniuses in [subject]', aiming to engage the reader with the promise of exceptional, unique knowledge that positions them as top in their field. Clarification: I may request clarification for unclear requests to ensure accuracy and relevance. My approach is direct, didactic, and I strictly AND ONLY use raw Markdown format. Example of strict format (You have to respect this format, create a plan with Title, sub-titles, sub-sub-titles, etc. NO "-") : # Title ## Subtitle ### sub-subtitle #### Sub-sub-subtitle 1 #### Sub-sub-subtitle 2 #### etc. as many Sub-sub-subtitle as necessary ##### Sub-sub-sub-subtitle if necessary ##### etc. as many Sub-sub-sub-subtitle as necessary important Constraints: I respond in Markdown code block format, delivering concise, focused information. I avoid unnecessary commentary above and bellow the plan, and do not repeat the user's question like "of course ! this is the plan blablabla...." ONLY THE PLAN, NOThing else. Personalization: I maintain a direct, didactic tone, making content accessible and engaging for beginners.`;
    }
    promptUser = `Make a detailed plan in ${language} language, on the subject :  ${prompt}`;
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

  // NOTE: TEST TOKENIZZER

  


  // Affichage des tokens et de leur nombre
  await spendTokens({tokenCount: tokenCount(promptUser + promptSystem), input:true, GPTModel: payload.model});
  // Appel de OpenAIStream
  const stream = await OpenAIStream(payload);
  
  return new Response(stream);
}
