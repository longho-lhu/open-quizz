"use server";
import { db } from "@/lib/db";
import { liveSessionsTable, participantsTable, participantAnswersTable, quizzesTable } from "@/lib/schema";
import { eq, inArray, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function hostQuizAction(quizId: string) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") throw new Error("Unauthorized");

  const sessionId = Math.random().toString(36).slice(2);
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  await db.insert(liveSessionsTable).values({
    id: sessionId,
    quizId,
    code,
    status: "WAITING",
  });

  return sessionId;
}

export async function getSessionStatus(sessionId: string) {
  const sess = await db.query.liveSessionsTable.findFirst({
    where: eq(liveSessionsTable.id, sessionId),
    with: {
      quiz: {
        with: {
          questions: true,
        }
      }
    }
  });
  
  if (!sess) return null;
  
  const participants = await db.query.participantsTable.findMany({
    where: eq(participantsTable.sessionId, sessionId),
    with: { answers: true }
  });
  
  return { session: sess, participants };
}

export async function startGameAction(sessionId: string) {
  await db.update(liveSessionsTable)
    .set({ status: "IN_PROGRESS", currentQuestionIndex: 0, startedAt: new Date() })
    .where(eq(liveSessionsTable.id, sessionId));
}

export async function nextQuestionAction(sessionId: string, nextIndex: number) {
  await db.update(liveSessionsTable)
    .set({ currentQuestionIndex: nextIndex, startedAt: new Date() })
    .where(eq(liveSessionsTable.id, sessionId));
}

export async function endGameAction(sessionId: string) {
  await db.update(liveSessionsTable)
    .set({ status: "FINISHED" })
    .where(eq(liveSessionsTable.id, sessionId));
}

export async function forceEndSessionAction(sessionId: string) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") throw new Error("Unauthorized");
  await db.update(liveSessionsTable)
    .set({ status: "FINISHED" })
    .where(eq(liveSessionsTable.id, sessionId));
  revalidatePath("/teacher/sessions");
}

export async function getTeacherSessions() {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") throw new Error("Unauthorized");

  const quizzes = await db.query.quizzesTable.findMany({
    where: eq(quizzesTable.creatorId, session.id)
  });
  
  const quizIds = quizzes.map((q: any) => q.id);
  if (quizIds.length === 0) return [];

  const sessions = await db.query.liveSessionsTable.findMany({
    where: inArray(liveSessionsTable.quizId, quizIds),
    with: {
      quiz: true,
      participants: {
        with: { answers: true }
      }
    }
  });

  return sessions.sort((a: any, b: any) => {
     const timeA = a.startedAt ? new Date(a.startedAt).getTime() : 0;
     const timeB = b.startedAt ? new Date(b.startedAt).getTime() : 0;
     return timeB - timeA;
  });
}

export async function renameSessionAction(sessionId: string, name: string) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") throw new Error("Unauthorized");
  await db.update(liveSessionsTable).set({ name }).where(eq(liveSessionsTable.id, sessionId));
  revalidatePath("/teacher/sessions");
}

export async function deleteSessionAction(sessionId: string) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") throw new Error("Unauthorized");

  const parts = await db.query.participantsTable.findMany({ where: eq(participantsTable.sessionId, sessionId) });
  const pIds = parts.map(p => p.id);
  if (pIds.length > 0) {
     await db.delete(participantAnswersTable).where(inArray(participantAnswersTable.participantId, pIds));
  }
  await db.delete(participantsTable).where(eq(participantsTable.sessionId, sessionId));
  await db.delete(liveSessionsTable).where(eq(liveSessionsTable.id, sessionId));
  
  revalidatePath("/teacher/sessions");
}

export async function updateSessionSettingsAction(sessionId: string, feedbackLevel: string, randomNicknames: boolean) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") throw new Error("Unauthorized");
  await db.update(liveSessionsTable).set({ feedbackLevel, randomNicknames }).where(eq(liveSessionsTable.id, sessionId));
}

export async function resetSessionAction(sessionId: string) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") throw new Error("Unauthorized");
  
  const parts = await db.query.participantsTable.findMany({ where: eq(participantsTable.sessionId, sessionId) });
  const pIds = parts.map(p => p.id);
  if (pIds.length > 0) {
     await db.delete(participantAnswersTable).where(inArray(participantAnswersTable.participantId, pIds));
  }
  await db.delete(participantsTable).where(eq(participantsTable.sessionId, sessionId));
  
  await db.update(liveSessionsTable).set({ status: 'WAITING', currentQuestionIndex: -1, startedAt: null }).where(eq(liveSessionsTable.id, sessionId));
  
  revalidatePath("/teacher/sessions");
}
