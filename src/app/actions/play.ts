"use server";
import { db } from "@/lib/db";
import { quizzesTable, liveSessionsTable, participantsTable, participantAnswersTable, optionsTable } from "@/lib/schema";
import { eq, and, not, desc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function kickParticipantAction(participantId: string) {
  try {
    await db.delete(participantsTable).where(eq(participantsTable.id, participantId));
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function joinQuizWithNicknameAction(code: string, nickname: string, deviceId: string = "unknown") {
  const codeUpper = code.toUpperCase();
  const activeSession = await db.query.liveSessionsTable.findFirst({
    where: eq(liveSessionsTable.code, codeUpper),
    with: {
      quiz: {
        with: { creator: true }
      }
    }
  });

  if (!activeSession) return { error: "Session not found or invalid game code." };
  if (activeSession.status === "FINISHED") return { error: "This game session has already finished." };

  // Check limits
  const currentParticipantsCount = await db.select({ count: sql`count(*)` })
    .from(participantsTable)
    .where(eq(participantsTable.sessionId, activeSession.id));
  const count = Number(currentParticipantsCount[0]?.count || 0);

  const plan = activeSession.quiz?.creator?.plan || "ECO";
  if (plan === "ECO" && count >= 100) {
    return { error: "Phòng đã đạt giới hạn 100 người chơi (Gói ECO)." };
  } else if (plan === "PRO" && count >= 500) {
    return { error: "Phòng đã đạt giới hạn 500 người chơi (Gói PRO)." };
  }

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
    deviceId,
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

  const leaderboard = await db.query.participantsTable.findMany({
    where: eq(participantsTable.sessionId, sessionId),
    columns: { id: true, nickname: true, randomName: true, score: true },
    orderBy: [desc(participantsTable.score)],
  });

  return { session, participant, answers, leaderboard };
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
    const timePassedMs = Math.max(0, timeLimit - timeLeft);
    let calculatedPoints = 1000;
    
    if (timeLimit <= 5000) {
      const ratio = timePassedMs / timeLimit;
      calculatedPoints = 1000 - (900 * ratio);
    } else {
      if (timePassedMs <= 5000) {
        // Drop slower (only 10% in first 5s)
        const earlyRatio = timePassedMs / 5000;
        calculatedPoints = 1000 - (100 * earlyRatio);
      } else {
        // Drop faster for the rest
        const lateTimePassed = timePassedMs - 5000;
        const remainingTime = timeLimit - 5000;
        const lateRatio = lateTimePassed / remainingTime;
        calculatedPoints = 900 - (800 * lateRatio);
      }
    }
    
    points = Math.max(100, Math.floor(calculatedPoints));
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

export async function submitTimeoutAction(participantId: string, questionId: string) {
  const existing = await db.query.participantAnswersTable.findFirst({
    where: and(
      eq(participantAnswersTable.participantId, participantId),
      eq(participantAnswersTable.questionId, questionId)
    )
  });

  if (existing) return { error: "Already answered" };

  const anyOption = await db.query.optionsTable.findFirst({
    where: eq(optionsTable.questionId, questionId)
  });

  await db.insert(participantAnswersTable).values({
    id: Math.random().toString(36).slice(2),
    participantId,
    questionId,
    optionId: anyOption ? anyOption.id : "timeout",
    points: 0,
    isCorrect: false,
    createdAt: new Date(),
  });

  return { success: true };
}
