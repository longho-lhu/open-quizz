"use server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { usersTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getLlama, LlamaChatSession, LlamaJsonSchemaGrammar } from "node-llama-cpp";
const pdfParse = require("pdf-parse");

// Standard JSON schema for node-llama-cpp
const responseJsonSchema = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      description: "List of multiple choice questions",
      items: {
        type: "object",
        properties: {
          text: { type: "string", description: "The question text" },
          options: {
            type: "array",
            description: "Must have exactly 4 options with exactly 1 correct option",
            items: {
              type: "object",
              properties: {
                text: { type: "string", description: "Option text" },
                isCorrect: { type: "boolean", description: "Whether this option is the correct answer" }
              },
              required: ["text", "isCorrect"]
            }
          }
        },
        required: ["text", "options"]
      }
    }
  },
  required: ["questions"]
} as const;

export async function generateQuizQuestionsAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized. Please log in as a teacher." };

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, session.id)
  });

  if (!user?.localModelPath) {
    return { error: "Please configure your Local Llama Model Path in Settings first." };
  }

  const topic = formData.get("topic") as string;
  const count = Number(formData.get("count")) || 3;
  if (count > 50) return { error: "Maximum 50 questions allowed per request." };
  const bloomLevel = formData.get("bloomLevel") as string || "Understanding";
  const language = formData.get("language") as string || "Vietnamese";
  const file = formData.get("file") as File | null;
  const documentText = formData.get("documentText") as string || ""; 

  let extractedFileText = "";
  if (file && file.size > 0) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (file.type === "application/pdf") {
        const pdfData = await pdfParse(buffer);
        extractedFileText = pdfData.text;
      } else {
        // Fallback for raw text files
        extractedFileText = buffer.toString("utf8");
      }
    } catch (err) {
      console.error("File processing error", err);
      return { error: "Failed to process the uploaded file." };
    }
  }

  if (!topic && !documentText && !extractedFileText) {
    return { error: "Please provide a topic or upload a document." };
  }

  const promptText = `You are an expert educator.
Generate ${count} multiple choice questions corresponding to the Cognitive Level of "${bloomLevel}" in Bloom's Taxonomy.
The questions and answers MUST BE written in ${language}.
Each question must have exactly 4 options with only 1 correct answer.
IMPORTANT RESTRICTION: The question text MUST NOT exceed 50 words. Make it concise and easy to read.
${topic ? `Topic: ${topic}\n` : ""}
${documentText ? `Based on the following document content:\n${documentText.substring(0, 10000)}` : ""}
${extractedFileText ? `Based on the attached document content:\n${extractedFileText.substring(0, 10000)}` : ""}
`;

  try {
    const llama = await getLlama();
    const model = await llama.loadModel({ modelPath: user.localModelPath });
    const context = await model.createContext();
    const chatSession = new LlamaChatSession({ contextSequence: context.getSequence() });
    const grammar = new LlamaJsonSchemaGrammar(llama, responseJsonSchema);

    const responseText = await chatSession.prompt(promptText, {
      grammar: grammar,
      temperature: 0.7,
      maxTokens: 2048,
    });
    
    if (!responseText) throw new Error("No response text from Llama");
    const object = JSON.parse(responseText);
    return { success: true, questions: object.questions };
  } catch (err: any) {
    console.error("AI Generation Error:", err);
    return { error: "Failed to generate questions. Ensure your local model path is valid and the model is running." };
  }
}
