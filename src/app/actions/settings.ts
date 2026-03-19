"use server";

import { db } from "@/lib/db";
import { usersTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateApiKeyAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };
  
  const key = formData.get("apiKey") as string;
  const model = formData.get("model") as string | null;
  const updateData: any = {};
  if (key !== undefined) updateData.geminiApiKey = key;
  if (model) updateData.geminiModel = model;

  await db.update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, session.id));

  revalidatePath("/teacher/settings");
  revalidatePath("/teacher/quiz/create");
  return { success: true };
}

export async function getApiKey() {
  const session = await getSession();
  if (!session) return null;
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, session.id)
  });
  return {
    apiKey: user?.geminiApiKey || null,
    model: user?.geminiModel || "gemini-3.1-flash-lite-preview"
  };
}
