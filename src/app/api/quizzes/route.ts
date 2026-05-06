import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quizzesTable, usersTable, questionsTable, optionsTable, quizSharesTable } from "@/lib/schema";
import { getSession, decrypt } from "@/lib/auth";
import { eq, desc, or, inArray } from "drizzle-orm";

/**
 * @swagger
 * /api/quizzes:
 *   post:
 *     summary: Create a new quiz
 *     description: Create a new quiz with questions and options. Requires Bearer Token or Session Cookie authentication.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - questions
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Math Quiz"
 *               description:
 *                 type: string
 *                 example: "A simple math quiz"
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - text
 *                     - options
 *                   properties:
 *                     text:
 *                       type: string
 *                       example: "What is 1 + 1?"
 *                     timeLimit:
 *                       type: integer
 *                       example: 15
 *                     imageUrl:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     options:
 *                       type: array
 *                       items:
 *                         type: object
 *                         required:
 *                           - text
 *                           - isCorrect
 *                         properties:
 *                           text:
 *                             type: string
 *                             example: "2"
 *                           isCorrect:
 *                             type: boolean
 *                             example: true
 *     responses:
 *       201:
 *         description: Quiz created successfully
 *       400:
 *         description: Bad request (missing fields or over limits)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest) {
  try {
    let session = null;

    // First, try to get Bearer token from header
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        session = await decrypt(token);
      } catch (e) {
        return NextResponse.json({ error: "Invalid Bearer token" }, { status: 401 });
      }
    }

    // Fallback to cookie session
    if (!session) {
      session = await getSession();
    }

    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized to create quizzes. Please log in as a Teacher." }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, questions } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "At least one question is required" }, { status: 400 });
    }

    // Check limits
    const currentUser = await db.query.usersTable.findFirst({ where: eq(usersTable.id, session.id) });
    const plan = currentUser?.plan || "ECO";

    if (plan === "ECO" && questions.length > 20) {
      return NextResponse.json({ error: "Gói ECO chỉ cho phép tối đa 20 câu hỏi mỗi Quiz." }, { status: 400 });
    } else if (plan === "PRO" && questions.length > 50) {
      return NextResponse.json({ error: "Gói PRO chỉ cho phép tối đa 50 câu hỏi mỗi Quiz." }, { status: 400 });
    }

    // Create Quiz
    const quizId = Math.random().toString(36).slice(2);
    await db.insert(quizzesTable).values({
      id: quizId,
      title,
      description: description || "",
      creatorId: session.id,
      createdAt: new Date(),
    });

    // Create Questions and Options
    for (const q of questions) {
      const questionId = Math.random().toString(36).slice(2);
      await db.insert(questionsTable).values({
        id: questionId,
        text: q.text,
        quizId: quizId,
        timeLimit: q.timeLimit || 15,
        imageUrl: q.imageUrl || null,
        createdAt: new Date(),
      });

      if (q.options && Array.isArray(q.options)) {
        for (const opt of q.options) {
          await db.insert(optionsTable).values({
            id: Math.random().toString(36).slice(2),
            text: opt.text,
            isCorrect: opt.isCorrect,
            questionId: questionId,
          });
        }
      }
    }

    return NextResponse.json({ success: true, quizId }, { status: 201 });
  } catch (error: any) {
    console.error("API Create Quiz Error:", error);
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/quizzes:
 *   get:
 *     summary: Get all quizzes
 *     description: Returns a list of quizzes created by or shared with the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of quizzes
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(req: NextRequest) {
  try {
    let session = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try { session = await decrypt(token); } catch (e) {}
    }
    if (!session) session = await getSession();

    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized to access quizzes" }, { status: 401 });
    }

    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, session.id) });
    if (!user || !user.email) return NextResponse.json([]);

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
      with: { questions: true },
    });

    const formattedQuizzes = allQuizzes.map((q) => ({
      ...q,
      _count: { questions: q.questions.length }
    }));

    return NextResponse.json(formattedQuizzes);
  } catch (error) {
    console.error("API Get Quizzes Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
