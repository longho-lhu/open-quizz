import { db } from "@/lib/db";
import { quizzesTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import QuizEditorClient from "@/components/QuizEditorClient";

export default async function EditQuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  const session = await getSession();
  if (!session || session.role !== "TEACHER") redirect("/login");

  const quiz = await db.query.quizzesTable.findFirst({
    where: eq(quizzesTable.id, quizId),
    with: {
      questions: {
        with: {
          options: true,
        },
      },
    },
  });

  if (!quiz || quiz.creatorId !== session.id) {
    redirect("/teacher/dashboard");
  }

  return <QuizEditorClient mode="edit" initialData={quiz} quizId={quiz.id} />;
}
