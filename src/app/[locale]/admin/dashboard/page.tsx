import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { usersTable, quizzesTable } from "@/lib/schema";
import { deleteUserAction, deleteQuizAction } from "@/app/actions/admin";
import { desc } from "drizzle-orm";
import DeleteButton from "@/components/DeleteButton";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const allUsers = await db.query.usersTable.findMany({
    orderBy: [desc(usersTable.createdAt)],
  });

  const allQuizzes = await db.query.quizzesTable.findMany({
    orderBy: [desc(quizzesTable.createdAt)],
    with: { creator: true },
  });

  return (
    <div className="max-w-6xl mx-auto w-full p-4 space-y-12 pb-20">
      <div>
        <h1 className="text-4xl font-black text-brand-dark mb-2">Platform Administration</h1>
        <p className="text-gray-500 font-bold">Manage users and global quizzes</p>
      </div>

      <section>
        <h2 className="text-2xl font-bold bg-white text-gray-800 px-6 py-4 rounded-t-2xl border-b-2 border-gray-100 flex items-center justify-between">
          <span>Users</span>
          <span className="bg-brand-purple/10 text-brand-purple px-3 py-1 rounded-full text-sm">{allUsers.length} total</span>
        </h2>
        <div className="bg-white border-x-2 border-b-2 border-gray-100 rounded-b-2xl shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-5 font-bold text-gray-500 border-b-2 border-gray-100 uppercase text-xs tracking-wider">ID</th>
                <th className="p-5 font-bold text-gray-500 border-b-2 border-gray-100 uppercase text-xs tracking-wider">Name / Email</th>
                <th className="p-5 font-bold text-gray-500 border-b-2 border-gray-100 uppercase text-xs tracking-wider">Role</th>
                <th className="p-5 font-bold text-gray-500 border-b-2 border-gray-100 uppercase text-xs tracking-wider">Created</th>
                <th className="p-5 font-bold text-gray-500 border-b-2 border-gray-100 text-right uppercase text-xs tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                  <td className="p-5 text-sm font-mono text-gray-400">{u.id}</td>
                  <td className="p-5">
                    <div className="font-bold text-gray-800">{u.name}</div>
                    <div className="text-sm text-brand-purple font-medium">{u.email}</div>
                  </td>
                  <td className="p-5 font-bold">
                    <span className={`px-2.5 py-1 rounded-lg text-xs tracking-wide ${u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : u.role === 'TEACHER' ? 'bg-brand-purple/20 text-brand-purple' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                  </td>
                  <td className="p-5 text-sm text-gray-500 font-medium">{u.createdAt?.toLocaleString()}</td>
                  <td className="p-5 text-right">
                    {u.role !== 'ADMIN' && (
                      <DeleteButton id={u.id} action={deleteUserAction} entityName="user" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold bg-white text-gray-800 px-6 py-4 rounded-t-2xl border-b-2 border-gray-100 flex items-center justify-between">
          <span>Quizzes</span>
          <span className="bg-brand-yellow/20 text-brand-yellow px-3 py-1 rounded-full text-sm">{allQuizzes.length} total</span>
        </h2>
        <div className="bg-white border-x-2 border-b-2 border-gray-100 rounded-b-2xl shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-5 font-bold text-gray-500 border-b-2 border-gray-100 uppercase text-xs tracking-wider">Quiz ID</th>
                <th className="p-5 font-bold text-gray-500 border-b-2 border-gray-100 uppercase text-xs tracking-wider">Title</th>
                <th className="p-5 font-bold text-gray-500 border-b-2 border-gray-100 uppercase text-xs tracking-wider">Creator</th>
                <th className="p-5 font-bold text-gray-500 border-b-2 border-gray-100 uppercase text-xs tracking-wider">Created</th>
                <th className="p-5 font-bold text-gray-500 border-b-2 border-gray-100 text-right uppercase text-xs tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allQuizzes.map(q => (
                <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                  <td className="p-5 text-sm font-mono text-gray-400">{q.id}</td>
                  <td className="p-5 font-bold text-gray-800">{q.title}</td>
                  <td className="p-5 font-bold text-brand-purple">{q.creator?.name || 'Unknown'}</td>
                  <td className="p-5 text-sm text-gray-500 font-medium">{q.createdAt?.toLocaleString()}</td>
                  <td className="p-5 text-right">
                    <DeleteButton id={q.id} action={deleteQuizAction} entityName="quiz" />
                  </td>
                </tr>
              ))}
              {allQuizzes.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400 font-bold italic">No quizzes exist on the platform.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
