import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { usersTable, teacherApprovalsTable } from "@/lib/schema";
import { deleteUserAction } from "@/app/actions/admin";
import { desc, eq, like, or } from "drizzle-orm";
import DeleteButton from "@/components/DeleteButton";
import PlanSelect from "@/components/PlanSelect";
import ApprovalButtons from "@/components/ApprovalButtons";
import AdminSearch from "@/components/AdminSearch";
import { getTranslations } from "next-intl/server";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const awaitedParams = await searchParams;
  const q = awaitedParams?.q || "";
  
  const t = await getTranslations("Admin");
  
  let whereClause = undefined;
  if (q) {
    whereClause = or(
      like(usersTable.name, `%${q}%`),
      like(usersTable.email, `%${q}%`)
    );
  }

  const allUsers = await db.query.usersTable.findMany({
    where: whereClause,
    orderBy: [desc(usersTable.createdAt)],
  });

  const pendingApprovals = await db.query.teacherApprovalsTable.findMany({
    where: eq(teacherApprovalsTable.status, "PENDING"),
    orderBy: [desc(teacherApprovalsTable.createdAt)],
    with: { user: true }
  });

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-black text-brand-dark mb-2">{t("usersDirectory")}</h1>
        <p className="text-gray-500 font-bold">{t("usersDesc")}</p>
      </div>

      {pendingApprovals.length > 0 && !q && (
        <section>
          <h2 className="text-xl font-bold bg-white text-gray-800 px-6 py-4 rounded-t-2xl border-b-2 border-gray-100 flex items-center justify-between">
            <span>{t("approvalsQueue")}</span>
            <span className="bg-brand-purple/10 text-brand-purple px-3 py-1 rounded-full text-sm font-bold">{pendingApprovals.length} {t("pending")}</span>
          </h2>
          <div className="bg-white border-x-2 border-b-2 border-gray-100 rounded-b-2xl shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 font-bold text-gray-500 border-b-2 border-gray-100 uppercase text-xs tracking-wider">{t("provider")}</th>
                  <th className="p-4 font-bold text-gray-500 border-b-2 border-gray-100 uppercase text-xs tracking-wider">{t("requestedAt")}</th>
                  <th className="p-4 font-bold text-gray-500 border-b-2 border-gray-100 text-right uppercase text-xs tracking-wider">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {pendingApprovals.map(approval => (
                  <tr key={approval.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-800">{approval.user?.name || t("unknown")}</div>
                      <div className="text-sm text-brand-purple font-medium">{approval.user?.email}</div>
                    </td>
                    <td className="p-4 text-sm text-gray-500 font-medium">{approval.createdAt?.toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <ApprovalButtons id={approval.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4 bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
            <span>{t("platformUsers")}</span>
            <span className="bg-brand-purple/10 text-brand-purple px-3 py-1 rounded-full text-sm">{allUsers.length} {t("total")}</span>
          </h2>
          <AdminSearch placeholder={t("searchUsers")} />
        </div>
        <div className="bg-white border-2 border-gray-100 rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b-2 border-gray-100">
              <tr>
                <th className="p-4 font-bold text-gray-500 uppercase text-xs tracking-wider">{t("idUser")}</th>
                <th className="p-4 font-bold text-gray-500 uppercase text-xs tracking-wider">{t("rolePlan")}</th>
                <th className="p-4 font-bold text-gray-500 uppercase text-xs tracking-wider">{t("createdAt")}</th>
                <th className="p-4 font-bold text-gray-500 text-right uppercase text-xs tracking-wider">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                  <td className="p-4">
                    <div className="text-xs font-mono text-gray-400 mb-1">{u.id}</div>
                    <div className="font-bold text-gray-800">{u.name}</div>
                    <div className="text-sm text-brand-purple font-medium">{u.email}</div>
                  </td>
                  <td className="p-4">
                    <div className="mb-2">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-widest ${u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : u.role === 'TEACHER' ? 'bg-brand-purple/20 text-brand-purple' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                    </div>
                    {u.role !== 'ADMIN' ? (
                      <PlanSelect userId={u.id} currentPlan={u.plan || 'ECO'} />
                    ) : (
                      <span className="px-2 py-1 flex max-w-[80px] justify-center rounded-lg text-xs font-bold bg-gray-100 text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-500 font-medium">{u.createdAt?.toLocaleString()}</td>
                  <td className="p-4 text-right">
                    {u.role !== 'ADMIN' && (
                      <DeleteButton id={u.id} action={deleteUserAction} entityName="user" />
                    )}
                  </td>
                </tr>
              ))}
              {allUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400 font-bold italic">{t("noUsers")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
