"use server";

import { db } from "@/lib/db";
import { usersTable, quizzesTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function deleteUserAction(formData: FormData) {
  try {
    await requireAdmin();
    const userId = formData.get("id") as string;
    if (!userId) return { error: "Missing user ID" };
    
    await db.delete(usersTable).where(eq(usersTable.id, userId));
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteQuizAction(formData: FormData) {
  try {
    await requireAdmin();
    const quizId = formData.get("id") as string;
    if (!quizId) return { error: "Missing quiz ID" };
    
    await db.delete(quizzesTable).where(eq(quizzesTable.id, quizId));
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
