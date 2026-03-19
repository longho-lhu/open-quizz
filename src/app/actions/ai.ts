"use server";

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { usersTable } from "@/lib/schema";
import { eq } from "drizzle-orm";

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      description: "List of multiple choice questions",
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "The question text" },
          options: {
            type: Type.ARRAY,
            description: "Must have exactly 4 options with exactly 1 correct option",
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING, description: "Option text" },
                isCorrect: { type: Type.BOOLEAN, description: "Whether this option is the correct answer" }
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
};

export async function generateQuizQuestionsAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized. Please log in as a teacher." };

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, session.id)
  });

  if (!user?.geminiApiKey) {
    return { error: "Please configure your Gemini API Key in Settings first." };
  }

  const topic = formData.get("topic") as string;
  const count = Number(formData.get("count")) || 3;
  if (count > 50) return { error: "Maximum 50 questions allowed per request." };
  const bloomLevel = formData.get("bloomLevel") as string || "Understanding";
  const language = formData.get("language") as string || "Vietnamese";
  const file = formData.get("file") as File | null;
  let documentText = formData.get("documentText") as string || "";

  if (file && file.size > 0) {
    try {
      if (file.type === "application/pdf") {
        const buffer = Buffer.from(await file.arrayBuffer());
        const pdfParseModule: any = await import("pdf-parse");
        const pdfParse = pdfParseModule.default || pdfParseModule;
        // @ts-ignore
        const pdfData = await pdfParse(buffer);
        documentText = pdfData.text;
      } else {
        documentText = await file.text();
      }
    } catch (err) {
      console.error("File parse error", err);
      return { error: "Failed to parse the uploaded file." };
    }
  }

  if (!topic && !documentText) {
    return { error: "Please provide a topic or upload a document." };
  }

  const ai = new GoogleGenAI({ apiKey: user.geminiApiKey });

  const prompt = `You are an expert educator.
Generate ${count} multiple choice questions corresponding to the Cognitive Level of "${bloomLevel}" in Bloom's Taxonomy.
The questions and answers MUST BE written in ${language}.
Each question must have exactly 4 options with only 1 correct answer.
${topic ? `Topic: ${topic}\n` : ""}
${documentText ? `Based on the following document content:\n${documentText.substring(0, 40000)}` : ""}`;

  try {
    const response = await ai.models.generateContent({
      model: user?.geminiModel || "gemini-3.1-flash-lite-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });
    
    if (!response.text) throw new Error("No response text from Gemini");
    const object = JSON.parse(response.text);
    return { success: true, questions: object.questions };
  } catch (err: any) {
    console.error("AI Generation Error:", err);
    return { error: "Failed to generate questions. Ensure your custom API key is valid." };
  }
}
