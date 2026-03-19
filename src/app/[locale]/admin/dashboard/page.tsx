import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { usersTable, quizzesTable, questionsTable } from "@/lib/schema";
import { sql } from "drizzle-orm";
import { getTranslations } from "next-intl/server";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const t = await getTranslations("Admin");

  // Fetch aggregated counts
  // Total Users
  const [userResult] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
  const totalUsers = userResult.count;

  // Roles distribution
  const rolesGroup = await db.select({
    role: usersTable.role,
    count: sql<number>`count(*)`
  }).from(usersTable).groupBy(usersTable.role);

  const totalTeachers = rolesGroup.find(r => r.role === 'TEACHER')?.count || 0;
  const totalStudents = rolesGroup.find(r => r.role === 'STUDENT')?.count || 0;

  // Plans distribution
  const plansGroup = await db.select({
    plan: usersTable.plan,
    count: sql<number>`count(*)`
  }).from(usersTable).groupBy(usersTable.plan);

  // Quizzes & Questions
  const [quizResult] = await db.select({ count: sql<number>`count(*)` }).from(quizzesTable);
  const totalQuizzes = quizResult.count;

  const [questionResult] = await db.select({ count: sql<number>`count(*)` }).from(questionsTable);
  const totalQuestions = questionResult.count;

  const avgQuestions = totalQuizzes > 0 ? (totalQuestions / totalQuizzes).toFixed(1) : "0";

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-black text-brand-dark mb-2">{t("platformMetrics")}</h1>
        <p className="text-gray-500 font-bold">{t("overviewDesc")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-100 flex flex-col justify-center">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">{t("totalUsers")}</h3>
          <div className="text-4xl font-black text-brand-dark">{totalUsers}</div>
          <div className="mt-4 flex justify-between items-center text-sm font-bold text-gray-500">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand-purple"></div> {t("teachers")}: {totalTeachers}</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-400"></div> {t("students")}: {totalStudents}</span>
          </div>
        </div>

        {/* Quizzes Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-100 flex flex-col justify-center">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">{t("totalQuizzes")}</h3>
          <div className="text-4xl font-black text-brand-dark">{totalQuizzes}</div>
          <div className="mt-4 flex justify-between text-sm font-bold text-brand-yellow">
            <span>{t("avgQuestions", { avg: avgQuestions })}</span>
          </div>
        </div>

        {/* Total Questions */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-100 flex flex-col justify-center">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">{t("questionsBank")}</h3>
          <div className="text-4xl font-black text-brand-dark">{totalQuestions}</div>
          <div className="mt-4 text-sm font-bold text-gray-400">
            {t("acrossCreators")}
          </div>
        </div>

        {/* Plans Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-100 flex flex-col justify-center lg:col-span-1 md:col-span-2">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 border-b-2 border-gray-50 pb-2">{t("planGroups")}</h3>
          <div className="space-y-2 mt-1 flex-1 overflow-y-auto pr-2">
            {plansGroup.sort((a,b) => b.count - a.count).map(p => (
              <div key={p.plan} className="flex justify-between items-center text-sm font-bold text-gray-700">
                <span className="flex items-center gap-2 flex-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400 shadow-sm"></span>
                  {p.plan || t("unknown")}
                </span>
                <span className="bg-gray-100 px-2.5 py-0.5 rounded-lg text-xs">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
