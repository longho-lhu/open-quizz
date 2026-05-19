"use server";

import { db } from "@/lib/db";
import { usersTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateLocalModelAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };
  
  const localModelPath = formData.get("localModelPath") as string;
  const localModel = formData.get("localModel") as string | null;
  const updateData: any = {};
  if (localModelPath !== undefined) updateData.localModelPath = localModelPath;
  if (localModel) updateData.localModel = localModel;

  await db.update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, session.id));

  revalidatePath("/teacher/settings");
  revalidatePath("/teacher/quiz/create");
  return { success: true };
}

export async function getLocalModelConfig() {
  const session = await getSession();
  if (!session) return null;
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, session.id)
  });
  return {
    localModelPath: user?.localModelPath || null,
    localModel: user?.localModel || ""
  };
}
