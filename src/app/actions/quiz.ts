"use server";

import { db } from "@/lib/db";
import { quizzesTable, usersTable, questionsTable, optionsTable, liveSessionsTable, participantsTable, participantAnswersTable, quizSharesTable } from "@/lib/schema";
import { revalidatePath } from "next/cache";
import { desc, eq, inArray, or, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function getQuizzes() {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") return [];

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, session.id) });
  if (!user || !user.email) return [];

  const shared = await db.query.quizSharesTable.findMany({ where: eq(quizSharesTable.shareToEmail, user.email) });
  const sharedQuizIds = shared.map(s => s.quizId);

  let whereClause;
  if (sharedQuizIds.length > 0) {
      whereClause = or(eq(quizzesTable.creatorId, session.id), inArray(quizzesTable.id, sharedQuizIds));
  } else {
      whereClause = eq(quizzesTable.creatorId, session.id);
  }

  const allQuizzes = await db.query.quizzesTable.findMany({
    where: whereClause,
    orderBy: [desc(quizzesTable.createdAt)],
    with: {
      questions: true,
    },
  });

  return allQuizzes.map((q) => ({
    ...q,
    _count: { questions: q.questions.length }
  }));
}

export type CreateQuizState = {
  success?: boolean;
  error?: string;
  quizId?: string;
};

export async function createQuiz(formData: FormData): Promise<CreateQuizState> {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const questionsJson = formData.get("questions") as string;

  if (!title) return { error: "Title is required" };
  
  let questions = [];
  try {
    if (questionsJson) questions = JSON.parse(questionsJson);
  } catch (e) {
    return { error: "Invalid questions format" };
  }

  if (questions.length === 0) return { error: "At least one question is required" };

  try {
    const session = await getSession();
    if (!session || session.role !== "TEACHER") {
      throw new Error("Unauthorized to create quizzes. Please log in.");
    }
    
    const teacher = { id: session.id };

    const [quiz] = await db.insert(quizzesTable).values({
      id: Math.random().toString(36).slice(2),
      title,
      description,
      creatorId: teacher.id,
      createdAt: new Date(),
    }).returning();

    for (const q of questions) {
      const [question] = await db.insert(questionsTable).values({
        id: Math.random().toString(36).slice(2),
        text: q.text,
        quizId: quiz.id,
        timeLimit: q.timeLimit || 15,
        createdAt: new Date(),
      }).returning();

      for (const opt of q.options) {
        await db.insert(optionsTable).values({
          id: Math.random().toString(36).slice(2),
          text: opt.text,
          isCorrect: opt.isCorrect,
          questionId: question.id,
        });
      }
    }

    revalidatePath("/teacher/dashboard");
    return { success: true, quizId: quiz.id };
  } catch (error: any) {
    return { error: error.message || "Failed to create quiz" };
  }
}

export async function deleteQuizAction(quizId: string) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") throw new Error("Unauthorized");

  const quiz = await db.query.quizzesTable.findFirst({ where: eq(quizzesTable.id, quizId) });
  if (!quiz || quiz.creatorId !== session.id) throw new Error("Unauthorized");

  // We abstract sessions deletion logic into an unexported action to avoid circular dependencies
  // But wait, we can just delete sessions directly here
  const liveSessions = await db.query.liveSessionsTable.findMany({ where: eq(liveSessionsTable.quizId, quizId) });
  const sIds = liveSessions.map(s => s.id);
  if (sIds.length > 0) {
      const parts = await db.query.participantsTable.findMany({ where: inArray(participantsTable.sessionId, sIds) });
      const pIds = parts.map(p => p.id);
      if (pIds.length > 0) {
         await db.delete(participantAnswersTable).where(inArray(participantAnswersTable.participantId, pIds));
      }
      await db.delete(participantsTable).where(inArray(participantsTable.sessionId, sIds));
      await db.delete(liveSessionsTable).where(inArray(liveSessionsTable.id, sIds));
  }
  
  const questions = await db.query.questionsTable.findMany({ where: eq(questionsTable.quizId, quizId) });
  const qIds = questions.map((q: any) => q.id);
  if (qIds.length > 0) {
      await db.delete(optionsTable).where(inArray(optionsTable.questionId, qIds));
      await db.delete(questionsTable).where(inArray(questionsTable.id, qIds));
  }
  
  await db.delete(quizzesTable).where(eq(quizzesTable.id, quizId));
  revalidatePath("/teacher/dashboard");
  return { success: true };
}

export async function updateQuizAction(formData: FormData): Promise<CreateQuizState> {
  const quizId = formData.get("quizId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const questionsJson = formData.get("questions") as string;

  if (!quizId || !title) return { error: "Quiz ID and Title are required" };
  
  let questions = [];
  try {
    if (questionsJson) questions = JSON.parse(questionsJson);
  } catch (e) {
    return { error: "Invalid questions format" };
  }

  if (questions.length === 0) return { error: "At least one question is required" };

  try {
    const session = await getSession();
    if (!session || session.role !== "TEACHER") {
      throw new Error("Unauthorized to update quizzes. Please log in.");
    }

    const quiz = await db.query.quizzesTable.findFirst({ where: eq(quizzesTable.id, quizId) });
    if (!quiz || quiz.creatorId !== session.id) {
      throw new Error("Unauthorized");
    }

    // Update the Quiz Metadata
    await db.update(quizzesTable).set({ title, description }).where(eq(quizzesTable.id, quizId));

    // Delete existing questions and options. Note: we must first delete participant answers mapping to these questions to satisfy FK constraints.
    const existingQuestions = await db.query.questionsTable.findMany({ where: eq(questionsTable.quizId, quizId) });
    const qIds = existingQuestions.map((q: any) => q.id);
    if (qIds.length > 0) {
        await db.delete(participantAnswersTable).where(inArray(participantAnswersTable.questionId, qIds));
        await db.delete(optionsTable).where(inArray(optionsTable.questionId, qIds));
        await db.delete(questionsTable).where(inArray(questionsTable.id, qIds));
    }

    // Insert new questions and options
    for (const q of questions) {
      const [question] = await db.insert(questionsTable).values({
        id: Math.random().toString(36).slice(2),
        text: q.text,
        quizId: quizId,
        timeLimit: q.timeLimit || 15,
        createdAt: new Date(),
      }).returning();

      for (const opt of q.options) {
        await db.insert(optionsTable).values({
          id: Math.random().toString(36).slice(2),
          text: opt.text,
          isCorrect: opt.isCorrect,
          questionId: question.id,
        });
      }
    }

    revalidatePath("/teacher/dashboard");
    revalidatePath(`/teacher/quiz/${quizId}/edit`);
    return { success: true, quizId };
  } catch (error: any) {
    return { error: error.message || "Failed to update quiz" };
  }
}

export async function renameQuizAction(quizId: string, title: string) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") throw new Error("Unauthorized");
  await db.update(quizzesTable).set({ title }).where(eq(quizzesTable.id, quizId));
  revalidatePath("/teacher/dashboard");
  return { success: true };
}

export async function shareQuizAction(quizId: string, email: string) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") throw new Error("Unauthorized");

  const quiz = await db.query.quizzesTable.findFirst({ where: eq(quizzesTable.id, quizId) });
  if (!quiz || quiz.creatorId !== session.id) throw new Error("Unauthorized");

  if (!email || !email.includes("@")) throw new Error("Invalid email format");

  const existing = await db.query.quizSharesTable.findFirst({
    where: and(eq(quizSharesTable.quizId, quizId), eq(quizSharesTable.shareToEmail, email))
  });
  
  if (existing) return { success: true };

  await db.insert(quizSharesTable).values({
    id: Math.random().toString(36).slice(2),
    quizId,
    shareToEmail: email,
    sharedAt: new Date(),
  });

  revalidatePath("/teacher/dashboard");
  return { success: true };
}
