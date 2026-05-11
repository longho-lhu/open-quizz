import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { quizzesTable, questionsTable, optionsTable } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';
import { decrypt } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let sessionData;
    try {
      sessionData = await decrypt(token);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!sessionData || !sessionData.id) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userId = sessionData.id as string;

    // Fetch all quizzes for this user
    const quizzes = await db.query.quizzesTable.findMany({
      where: eq(quizzesTable.creatorId, userId),
    });

    if (quizzes.length === 0) {
      return NextResponse.json({ success: true, quizzes: [], questions: [], options: [] });
    }

    const quizIds = quizzes.map((q) => q.id);

    // Fetch all questions for these quizzes
    const questions = await db.query.questionsTable.findMany({
      where: inArray(questionsTable.quizId, quizIds),
    });

    let options: any[] = [];
    if (questions.length > 0) {
      const questionIds = questions.map((q) => q.id);
      options = await db.query.optionsTable.findMany({
        where: inArray(optionsTable.questionId, questionIds),
      });
    }

    return NextResponse.json({
      success: true,
      quizzes,
      questions,
      options,
    });
  } catch (error) {
    console.error('Sync Export Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
