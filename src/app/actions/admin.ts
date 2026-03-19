"use server";

import { db } from "@/lib/db";
import { usersTable, quizzesTable, teacherApprovalsTable } from "@/lib/schema";
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

export async function updateUserPlanAction(userId: string, newPlan: string) {
  try {
    await requireAdmin();
    if (!userId || !newPlan) return { error: "Missing data" };
    
    await db.update(usersTable).set({ plan: newPlan }).where(eq(usersTable.id, userId));
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function approveTeacherAction(id: string) {
  try {
    await requireAdmin();
    if (!id) return { error: "Missing approval ID" };

    const approval = await db.query.teacherApprovalsTable.findFirst({
      where: eq(teacherApprovalsTable.id, id),
    });

    if (!approval) return { error: "Approval request not found" };

    await db.update(usersTable).set({ role: "TEACHER" }).where(eq(usersTable.id, approval.userId));
    await db.update(teacherApprovalsTable).set({ status: "APPROVED" }).where(eq(teacherApprovalsTable.id, id));

    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function rejectTeacherAction(id: string) {
  try {
    await requireAdmin();
    if (!id) return { error: "Missing approval ID" };

    const approval = await db.query.teacherApprovalsTable.findFirst({
      where: eq(teacherApprovalsTable.id, id),
    });

    if (!approval) return { error: "Approval request not found" };

    await db.update(usersTable).set({ role: "TEACHER", plan: "ECO" }).where(eq(usersTable.id, approval.userId));
    await db.update(teacherApprovalsTable).set({ status: "REJECTED" }).where(eq(teacherApprovalsTable.id, id));

    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
