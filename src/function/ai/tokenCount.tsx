import GPT3Tokenizer from "gpt3-tokenizer";

export default function tokenCount(prompts: string) {
  let encodedPrompt;
  const tokenizer = new GPT3Tokenizer({ type: "codex" }); // ou 'codex'
  // Encodage synchrone
  encodedPrompt = tokenizer.encode(prompts);
  return encodedPrompt.bpe.length;
}
