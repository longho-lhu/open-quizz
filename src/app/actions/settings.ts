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
  await db.update(usersTable)
    .set({ geminiApiKey: key })
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
  return user?.geminiApiKey || null;
}
