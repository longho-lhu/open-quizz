"use server";
import { db } from "@/lib/db";
import { liveSessionsTable, participantsTable, participantAnswersTable, quizzesTable, quizSharesTable, usersTable } from "@/lib/schema";
import { eq, inArray, desc, and, or } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function hostQuizAction(quizId: string) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") throw new Error("Unauthorized");

  const quiz = await db.query.quizzesTable.findFirst({ where: eq(quizzesTable.id, quizId) });
  if (!quiz) throw new Error("Quiz not found");

  if (quiz.creatorId !== session.id) {
      const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, session.id) });
      const shared = await db.query.quizSharesTable.findFirst({
         where: and(eq(quizSharesTable.quizId, quizId), eq(quizSharesTable.shareToEmail, user!.email))
      });
      if (!shared) throw new Error("Unauthorized");
  }

  const sessionId = Math.random().toString(36).slice(2);
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  await db.insert(liveSessionsTable).values({
    id: sessionId,
    quizId,
    hostId: session.id,
    code,
    status: "WAITING",
  });

  return sessionId;
}

// Internal helper to verify ownership
async function verifyOwnership(sessionId: string, userId: string) {
  const ls = await db.query.liveSessionsTable.findFirst({ where: eq(liveSessionsTable.id, sessionId) });
  if (!ls) throw new Error("Not found");

  if (ls.hostId) {
      if (ls.hostId !== userId) throw new Error("Unauthorized");
  } else {
      const q = await db.query.quizzesTable.findFirst({ where: eq(quizzesTable.id, ls.quizId) });
      if (!q || q.creatorId !== userId) throw new Error("Unauthorized");
  }
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
  await verifyOwnership(sessionId, session.id);
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

  let conditions;
  if (quizIds.length > 0) {
      conditions = or(inArray(liveSessionsTable.quizId, quizIds), eq(liveSessionsTable.hostId, session.id));
  } else {
      conditions = eq(liveSessionsTable.hostId, session.id);
  }

  const sessions = await db.query.liveSessionsTable.findMany({
    where: conditions,
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
  await verifyOwnership(sessionId, session.id);
  await db.update(liveSessionsTable).set({ name }).where(eq(liveSessionsTable.id, sessionId));
  revalidatePath("/teacher/sessions");
}

export async function deleteSessionAction(sessionId: string) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") throw new Error("Unauthorized");
  await verifyOwnership(sessionId, session.id);

  const parts = await db.query.participantsTable.findMany({ where: eq(participantsTable.sessionId, sessionId) });
  const pIds = parts.map(p => p.id);
  if (pIds.length > 0) {
     await db.delete(participantAnswersTable).where(inArray(participantAnswersTable.participantId, pIds));
  }
  await db.delete(participantsTable).where(eq(participantsTable.sessionId, sessionId));
  await db.delete(liveSessionsTable).where(eq(liveSessionsTable.id, sessionId));
  
  revalidatePath("/teacher/sessions");
}

export async function updateSessionSettingsAction(sessionId: string, feedbackLevel: string, randomNicknames: boolean, timeoutWait: boolean = false, musicTheme: string = "none") {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") throw new Error("Unauthorized");
  await verifyOwnership(sessionId, session.id);
  await db.update(liveSessionsTable).set({ feedbackLevel, randomNicknames, timeoutWait, musicTheme }).where(eq(liveSessionsTable.id, sessionId));
}

export async function resetSessionAction(sessionId: string) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") throw new Error("Unauthorized");
  await verifyOwnership(sessionId, session.id);
  
  const parts = await db.query.participantsTable.findMany({ where: eq(participantsTable.sessionId, sessionId) });
  const pIds = parts.map(p => p.id);
  if (pIds.length > 0) {
     await db.delete(participantAnswersTable).where(inArray(participantAnswersTable.participantId, pIds));
  }
  await db.delete(participantsTable).where(eq(participantsTable.sessionId, sessionId));
  
  await db.update(liveSessionsTable).set({ status: 'WAITING', currentQuestionIndex: -1, startedAt: null }).where(eq(liveSessionsTable.id, sessionId));
  
  revalidatePath("/teacher/sessions");
}
