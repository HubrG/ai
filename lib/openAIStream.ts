// Import des utilitaires pour le parsing d'événements SSE (Server-Sent Events)
import spendTokens from "@/src/function/ai/spendTokens";
import tokenCount from "@/src/function/ai/tokenCount";
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";

// Définition des rôles possibles dans une conversation avec ChatGPT
export type ChatGPTAgent = "user" | "system";

// Structure d'un message dans une conversation avec ChatGPT
export interface ChatGPTMessage {
  role: ChatGPTAgent; // Rôle de l'agent (utilisateur ou système)
  content: string; // Contenu du message
}

// Payload pour une requête de stream à l'API d'OpenAI
export interface OpenAIStreamPayload {
  model: string; // Modèle GPT à utiliser
  messages: ChatGPTMessage[]; // Tableau des messages de la conversation
  temperature: number; // Contrôle la randomisation des réponses
  top_p: number; // Contrôle la diversité des réponses
  frequency_penalty: number; // Pénalise les tokens fréquents pour plus de diversité
  presence_penalty: number; // Pénalise les tokens nouveaux pour plus de répétition
  max_tokens: number; // Nombre maximum de tokens par réponse
  stream: boolean; // Indique si la réponse doit être streamée
  n: number; // Nombre de réponses à générer
}

// Fonction pour créer un stream de réponse de l'API d'OpenAI
export async function OpenAIStream(payload: OpenAIStreamPayload) {
  // Encodeurs pour gérer la conversion des données streamées
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Compteur pour suivre le nombre de messages reçus
  let counter = 0;

  // Requête HTTP à l'API d'OpenAI pour démarrer le stream
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
    },
    method: "POST",
    body: JSON.stringify(payload),
  });
  let totalTokens = 0;
  // Création d'un stream lisible à partir de la réponse HTTP
  const stream = new ReadableStream({
    async start(controller) {
      // Fonction de callback pour gérer les événements SSE parsés
      function onParse(event: ParsedEvent | ReconnectInterval) {
        if (event.type === "event") {
          const data = event.data;
          // console.log(data);

          // Vérifie si le signal de fin de stream est reçu
          if (data === "[DONE]") {
           
            // On dépense le nombre de tokens
            spendTokens({ tokenCount: totalTokens, output: true, GPTModel: payload.model }); 
            // Ferme le stream
            controller.close();
            return;
          }
          try {
            // Tente de parser la donnée JSON reçue
            const json = JSON.parse(data);
            // console.log(json)
            const text = json.choices[0].delta?.content || "";
            // On compte le nombre de tokens
            totalTokens = tokenCount(text) + totalTokens;

            // Ignore les deux premiers sauts de ligne qui sont considérés comme préfixes
            if (counter < 2 && (text.match(/\n/) || []).length) {
              return;
            }
            // Encode le texte en un format adapté au stream et l'envoie dans le stream
            const queue = encoder.encode(text);
            controller.enqueue(queue);
            counter++;
          } catch (e) {
            // Gère les erreurs de parsing
            controller.error(e);
          }
        }
      }

      // Création d'un parser pour les événements SSE
      const parser = createParser(onParse);
      // Itération asynchrone sur les morceaux de données de la réponse
      for await (const chunk of res.body as any) {
        // Nourrit le parser avec le chunk décodé
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  // Retourne le stream pour utilisation ultérieure
  return stream;
}
