import Groq from "groq-sdk";

// Ensure environment variable is set
if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is not set in the environment variables");
}

// Initialize Groq client
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Helper function to generate response with sources
export async function generateResponseWithSources(
  prompt: string,
  sources: { url: string; content: string }[]
) {
  try {
    // Construct a prompt that includes source context
    const sourceContext = sources
      .map(
        (source, index) =>
          `Source ${index + 1} (${source.url}):\n${source.content}`
      )
      .join("\n\n");

    const fullPrompt = `
Context from web sources:
${sourceContext}

User Question: ${prompt}

Please provide a comprehensive answer to the question, using the context from the sources. 
Ensure to:
1. Answer the question directly
2. Cite the specific sources used for each part of the answer
3. Format the response with clear source attributions
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

// import Groq from 'groq-sdk';

// const client = new Groq({});

// async function getGroqResponse(message: string) {
//     try {
//         const response = await client.request(message);
//         return response;
//     } catch (error) {
//         console.error(error);
//     }
// }

// export default getGroqResponse
