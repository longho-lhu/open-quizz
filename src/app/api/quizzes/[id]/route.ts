import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quizzesTable, usersTable, questionsTable, optionsTable, participantAnswersTable } from "@/lib/schema";
import { getSession, decrypt } from "@/lib/auth";
import { eq, inArray } from "drizzle-orm";

/**
 * @swagger
 * /api/quizzes/{id}:
 *   put:
 *     summary: Update an existing quiz
 *     description: Update an existing quiz along with its questions and options. Requires Bearer Token or Session Cookie authentication. Note that updating will overwrite all existing questions.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The quiz ID
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
 *                 example: "Math Quiz v2"
 *               description:
 *                 type: string
 *                 example: "Updated math quiz"
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
 *                       example: "What is 2 + 2?"
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
 *                             example: "4"
 *                           isCorrect:
 *                             type: boolean
 *                             example: true
 *     responses:
 *       200:
 *         description: Quiz updated successfully
 *       400:
 *         description: Bad request (missing fields or over limits)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not the owner)
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: quizId } = await params;

    let session = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try { session = await decrypt(token); } catch (e) {}
    }
    if (!session) session = await getSession();

    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized to update quizzes" }, { status: 401 });
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

    const quiz = await db.query.quizzesTable.findFirst({ where: eq(quizzesTable.id, quizId) });
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }
    if (quiz.creatorId !== session.id) {
      return NextResponse.json({ error: "Forbidden: You are not the owner of this quiz" }, { status: 403 });
    }

    // Update the Quiz Metadata
    await db.update(quizzesTable).set({ title, description: description || "" }).where(eq(quizzesTable.id, quizId));

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

    return NextResponse.json({ success: true, quizId }, { status: 200 });
  } catch (error: any) {
    console.error("API Update Quiz Error:", error);
    return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 });
  }
}
