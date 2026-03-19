import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { quizzesTable } from "@/lib/schema";
import { deleteQuizAction } from "@/app/actions/admin";
import { desc, like } from "drizzle-orm";
import DeleteButton from "@/components/DeleteButton";
import AdminSearch from "@/components/AdminSearch";
import { getTranslations } from "next-intl/server";

export default async function AdminQuizzesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const awaitedParams = await searchParams;
  const q = awaitedParams?.q || "";

  const t = await getTranslations("Admin");

  const allQuizzes = await db.query.quizzesTable.findMany({
    where: q ? like(quizzesTable.title, `%${q}%`) : undefined,
    orderBy: [desc(quizzesTable.createdAt)],
    with: { creator: true },
  });

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-black text-brand-dark mb-2">{t("platformQuizzes")}</h1>
        <p className="text-gray-500 font-bold">{t("quizzesDesc")}</p>
      </div>

      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4 bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
            <span>{t("allQuizzes")}</span>
            <span className="bg-brand-yellow/20 text-brand-yellow px-3 py-1 rounded-full text-sm">{allQuizzes.length} {t("total")}</span>
          </h2>
          <AdminSearch placeholder={t("searchQuizzes")} />
        </div>
        <div className="bg-white border-2 border-gray-100 rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b-2 border-gray-100">
              <tr>
                <th className="p-4 font-bold text-gray-500 uppercase text-xs tracking-wider">{t("idTitle")}</th>
                <th className="p-4 font-bold text-gray-500 uppercase text-xs tracking-wider">{t("creator")}</th>
                <th className="p-4 font-bold text-gray-500 uppercase text-xs tracking-wider">{t("createdAt")}</th>
                <th className="p-4 font-bold text-gray-500 text-right uppercase text-xs tracking-wider">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {allQuizzes.map(q => (
                <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                  <td className="p-4">
                    <div className="text-xs font-mono text-gray-400 mb-1">{q.id}</div>
                    <div className="font-bold text-gray-800">{q.title}</div>
                  </td>
                  <td className="p-4 font-bold text-brand-purple">{q.creator?.name || t("unknown")}</td>
                  <td className="p-4 text-sm text-gray-500 font-medium">{q.createdAt?.toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <DeleteButton id={q.id} action={deleteQuizAction} entityName="quiz" />
                  </td>
                </tr>
              ))}
              {allQuizzes.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400 font-bold italic">{t("noQuizzes")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
