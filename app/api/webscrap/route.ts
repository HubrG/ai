import fetch from 'isomorphic-fetch'
import { load } from 'cheerio';
import OpenAI from 'openai';
const openai = new OpenAI();
import { OpenAIStream, OpenAIStreamPayload } from '@/lib/openAIStream';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing env var from OpenAI');
}

export const runtime = 'edge';

export async function POST(req: Request): Promise<Response> {
  const { prompt } = (await req.json()) as {
    prompt?: string;
  };

  if (!prompt) {
    return new Response('No prompt in the request', { status: 400 });
  }

  const url = prompt;
  const response = await fetch(url);
  const body = await response.text();
  const $ = load(body);

  let filteredContent = '';

  $('h1, h2, h3, h4, h5, h6, p, blockquote, em, strong, a').each(function () {
    if (!$(this).parents('footer, nav').length) {
      filteredContent += $(this).text().trim() + ' ';
    }
  });

  const promptFinal = 'Écris le sujet du mail, et le mail pour ce contenu : ' + filteredContent;
  const payload: OpenAIStreamPayload = {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: promptFinal }],
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 1000,
    stream: true,
    n: 1,
  };

  const stream = await OpenAIStream(payload);
  return new Response(stream);
}
