"use server";
import { db } from "@/lib/db";
import { quizzesTable, liveSessionsTable, participantsTable, participantAnswersTable, optionsTable } from "@/lib/schema";
import { eq, and, not, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function joinQuizWithNicknameAction(code: string, nickname: string) {
  const codeUpper = code.toUpperCase();
  const activeSession = await db.query.liveSessionsTable.findFirst({
    where: eq(liveSessionsTable.code, codeUpper),
  });

  if (!activeSession) return { error: "Session not found or invalid game code." };
  if (activeSession.status === "FINISHED") return { error: "This game session has already finished." };

  const participantId = Math.random().toString(36).slice(2);
  
  const adjectives = ["Happy", "Fast", "Brave", "Clever", "Cool", "Mighty", "Super", "Wild", "Sunny", "Lucky"];
  const animals = ["Tiger", "Lion", "Panda", "Koala", "Monkey", "Penguin", "Dolphin", "Eagle", "Fox", "Rabbit"];
  const randomName = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${animals[Math.floor(Math.random() * animals.length)]} ${Math.floor(Math.random() * 100)}`;

  const sessionData = await getSession();

  await db.insert(participantsTable).values({
    id: participantId,
    userId: sessionData ? sessionData.id : null,
    sessionId: activeSession.id,
    nickname,
    randomName,
  });

  return { success: true, sessionId: activeSession.id, participantId };
}

// Action to fetch participant status and current session state
export async function getParticipantState(sessionId: string, participantId: string) {
  const session = await db.query.liveSessionsTable.findFirst({
    where: eq(liveSessionsTable.id, sessionId),
    with: {
      quiz: {
        with: {
          questions: {
            with: { options: true }
          }
        }
      }
    }
  });

  if (!session) return null;

  const participant = await db.query.participantsTable.findFirst({
    where: eq(participantsTable.id, participantId),
  });

  // Fetch all answers by this participant
  const answers = await db.query.participantAnswersTable.findMany({
    where: eq(participantAnswersTable.participantId, participantId),
  });

  return { session, participant, answers };
}

export async function submitAnswerAction(participantId: string, questionId: string, optionId: string, timeLeft: number, timeLimit: number) {
  // Verify answer hasn't been submitted
  const existing = await db.query.participantAnswersTable.findFirst({
    where: and(
      eq(participantAnswersTable.participantId, participantId),
      eq(participantAnswersTable.questionId, questionId)
    )
  });

  if (existing) return { error: "Already answered" };

  const option = await db.query.optionsTable.findFirst({
    where: eq(optionsTable.id, optionId)
  });

  if (!option) return { error: "Invalid option" };

  let points = 0;
  if (option.isCorrect) {
    // 100 to 1000 points based on time left
    const ratio = Math.max(0, Math.min(1, timeLeft / timeLimit));
    points = Math.max(100, Math.floor(ratio * 1000));
  }

  await db.insert(participantAnswersTable).values({
    id: Math.random().toString(36).slice(2),
    participantId,
    questionId,
    optionId,
    points,
    isCorrect: option.isCorrect,
    createdAt: new Date(),
  });

  // Update participant total score
  const participant = await db.query.participantsTable.findFirst({
    where: eq(participantsTable.id, participantId)
  });
  
  if (participant) {
    await db.update(participantsTable)
      .set({ score: participant.score + points })
      .where(eq(participantsTable.id, participantId));
  }

  return { success: true, points, isCorrect: option.isCorrect };
}
