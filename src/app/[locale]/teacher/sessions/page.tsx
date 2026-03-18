import { getTeacherSessions } from "@/app/actions/live";
import { Link } from "@/i18n/routing";
import SessionAdminButtons from "@/components/SessionAdminButtons";
import { getTranslations } from "next-intl/server";
import { FiArchive } from "react-icons/fi";

export default async function TeacherSessionsHistory() {
  const t = await getTranslations("Sessions");
  const sessions = await getTeacherSessions();

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8">
      <div className="flex items-center justify-between">
         <div>
           <h1 className="text-4xl font-black text-brand-dark">{t("title")}</h1>
           <p className="text-xl font-medium text-gray-500 mt-2">View past quiz games and student results.</p>
         </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-12 text-center space-y-4">
          <FiArchive className="text-6xl text-gray-300 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-700">{t("noSessions")}</h2>
          <p className="text-gray-500">Host a Live Quiz to see history appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border-2 border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm font-bold uppercase tracking-wider border-b-2 border-gray-100">
                <th className="p-6">{t("gameCode")}</th>
                <th className="p-6">{t("quiz")}</th>
                <th className="p-6">{t("status")}</th>
                <th className="p-6">{t("date")}</th>
                <th className="p-6">{t("players")}</th>
                <th className="p-6">{t("winner")}</th>
                <th className="p-6">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((sess: any) => {
                const isFinished = sess.status === "FINISHED";
                const dateStr = sess.startedAt 
                  ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(sess.startedAt))
                  : "Not Started";

                const sortedParts = [...sess.participants].sort((a,b)=>b.score - a.score);
                const winner = sortedParts[0] ? `${sortedParts[0].nickname} (${sortedParts[0].score} pts)` : "-";
                
                return (
                  <tr key={sess.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-6">
                      <Link href={`/teacher/sessions/${sess.id}`} className="font-black text-brand-purple text-xl hover:underline">#{sess.code}</Link>
                    </td>
                    <td className="p-6 font-bold text-gray-800">{sess.quiz.title}</td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        sess.status === 'FINISHED' ? 'bg-gray-200 text-gray-600' :
                        sess.status === 'IN_PROGRESS' ? 'bg-brand-green/20 text-brand-green' : 'bg-brand-yellow/20 text-brand-yellow'
                      }`}>
                        {sess.status}
                      </span>
                    </td>
                    <td className="p-6 text-gray-500 font-medium">{dateStr}</td>
                    <td className="p-6 font-bold text-gray-700">{sess.participants.length}</td>
                    <td className="p-6 font-bold text-brand-purple">
                      {isFinished ? winner : "TBD"}
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-2">
                        <Link href={`/teacher/sessions/${sess.id}`} className="text-xs font-bold text-white bg-brand-purple px-3 py-1 rounded-full text-center hover:bg-purple-700 transition">{t("viewResults")}</Link>
                        <SessionAdminButtons sessionId={sess.id} currentName={sess.name || sess.quiz.title} status={sess.status} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
