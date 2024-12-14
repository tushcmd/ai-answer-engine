import Groq from "groq-sdk";
import { Message } from "@/types";

// Ensure environment variable is set
if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is not set in the environment variables");
}

// Initialize Groq client
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Helper function to generate response with sources and conversation context
export async function generateResponseWithSources(
  prompt: string,
  sources: { url: string; content: string }[],
  conversationHistory: Message[] = []
) {
  try {
    // Construct conversation history context
    const historicalContext = conversationHistory
      .map(
        msg => `${msg.role === "user" ? "Human" : "Assistant"}: ${msg.content}`
      )
      .join("\n");

    // Construct source context
    const sourceContext = sources
      .map(
        (source, index) =>
          `Source ${index + 1} (${source.url}):\n${source.content}`
      )
      .join("\n\n");

    const fullPrompt = `
Conversation History:
${historicalContext}

Context from web sources:
${sourceContext}

User Question: ${prompt}

Please provide a comprehensive answer to the question, taking into account:
1. The conversation history
2. The context from web sources
3. Answer the question directly
4. Cite the specific sources used for each part of the answer
5. Maintain coherence with the previous conversation
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: fullPrompt,
        },
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.5,
      max_tokens: 1024,
    });

    return {
      answer: chatCompletion.choices[0]?.message?.content || "",
      sources: sources.map(source => source.url),
    };
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
}
