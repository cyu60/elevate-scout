import Groq from "groq-sdk";
import OpenAI from "openai";
import { GROQ_API_KEY } from "./config";
import { initializeDatabase } from "./singleStoreClient"; // Import the database initialization function

import { AI } from "@singlestore/ai";
const ai = new AI({ openAIApiKey: process.env.OPENAI_API_KEY });

const groq = new Groq({
  apiKey: GROQ_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function generateEmbedding(text) {
  try {
    const response = await ai.embeddings.create(text);
    return response[0];
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null;
  }
}

export async function generateCommentaryWithGroq(encodedImage) {
  let retries = 0;
  let commentaryTable;

  // Initialize commentaryTable only once
  try {
    commentaryTable = await initializeDatabase(); // Ensure the table is initialized
  } catch (error) {
    console.error("Error initializing the database:", error);
    throw error;
  }

  while (retries < MAX_RETRIES) {
    try {
      console.log(
        "Preparing request to Groq API (Attempt " + (retries + 1) + ")"
      );
      console.log("Encoded image length:", encodedImage.length);
      console.log("GROQ_API_KEY set:", !!GROQ_API_KEY);

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: 'You are an expert analyst capable of analyzing and responding to data in JSON format. You are tasked with providing insights on what you see and whether you notice any signs of homelessness communities. The JSON schema should include:\n\n{\n  "commentary": str,\n  "likeliness_of_homelessness": int [0-100],\n  "latency": float\n}',
              },
              {
                type: "image_url",
                image_url: {
                  url: `${encodedImage}`,
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        model: "llama-3.2-11b-vision-preview",
        max_tokens: 150,
        temperature: 0,
      });

      const parsedContent = JSON.parse(
        chatCompletion.choices[0]?.message?.content
      );
      console.log("Received response from Groq API:", parsedContent);

      const commentary = parsedContent.commentary || "No commentary generated.";
      const likelinessOfHomelessness =
        parsedContent.likeliness_of_homelessness ?? 0; // Default fallback
      const latency = chatCompletion.usage?.completion_time || 0; // Default fallback

      // Generate embedding
      const embedding = await generateEmbedding(commentary);
      console.log(
        "Generated embedding:",
        embedding
          ? "Embedding generated successfully"
          : "Failed to generate embedding"
      );

      // Insert data into SingleStore
      const timestamp = new Date();

      if (!commentaryTable) {
        throw new Error("Commentary table is not initialized.");
      }

      await commentaryTable.insert([
        {
          timestamp: timestamp,
          commentary: commentary,
          embedding: JSON.stringify(embedding),
          latency: latency,
          homelessness_probability: likelinessOfHomelessness,
        },
      ]);

      return {
        commentary,
        embedding,
        likelinessOfHomelessness,
        latency,
      };
    } catch (error) {
      console.error(
        "Error generating commentary with Groq (Attempt " +
          (retries + 1) +
          "):",
        error
      );
      retries++;
      if (retries < MAX_RETRIES) {
        console.log("Retrying in " + RETRY_DELAY + "ms...");
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  return {
    commentary:
      "Error generating commentary after " + MAX_RETRIES + " attempts.",
    embedding: null,
    likelinessOfHomelessness: null,
    latency: null,
  };
}
