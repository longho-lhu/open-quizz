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

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return { error: "Please configure DEEPSEEK_API_KEY in your .env file." };
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

Return the response in valid JSON matching this schema:
{
  "questions": [
    {
      "text": "Question text",
      "options": [
        { "text": "Option A", "isCorrect": true },
        { "text": "Option B", "isCorrect": false },
        { "text": "Option C", "isCorrect": false },
        { "text": "Option D", "isCorrect": false }
      ]
    }
  ]
}

${topic ? `Topic: ${topic}\n` : ""}
${documentText ? `Based on the following document content:\n${documentText.substring(0, 10000)}` : ""}
${extractedFileText ? `Based on the attached document content:\n${extractedFileText.substring(0, 10000)}` : ""}
`;

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: promptText }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Deepseek API Error:", errBody);
      throw new Error(`Deepseek API returned ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices[0].message.content;
    const object = JSON.parse(responseText);

    if (!object.questions || !Array.isArray(object.questions)) {
      throw new Error("Invalid response format from AI");
    }

    return { success: true, questions: object.questions };
  } catch (err: any) {
    console.error("AI Generation Error:", err);
    return { error: "Failed to generate questions using Deepseek API." };
  }
}
