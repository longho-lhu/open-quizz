import { db } from "@/lib/db";
import { participantsTable } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { FiClock, FiStar, FiAward } from "react-icons/fi";

export default async function StudentHistoryPage() {
  const t = await getTranslations("StudentHistory");
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/login");

  const participantsInfo = await db.query.participantsTable.findMany({
    where: eq(participantsTable.userId, session.id),
    with: {
      session: {
        with: {
          quiz: true,
        }
      }
    }
  });

  // Since drizzle doesn't natively orderBy nested relations easily, we can sort in JS
  const history = participantsInfo.sort((a, b) => {
    const aTime = a.session.startedAt?.getTime() || 0;
    const bTime = b.session.startedAt?.getTime() || 0;
    return bTime - aTime;
  });

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-brand-dark">{t('title')}</h1>
          <p className="text-gray-500">{t('subtitle')}</p>
        </div>
        <Link href="/join" className="btn-primary">
          {t('joinNewGame')}
        </Link>
      </div>

      {history.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-12 text-center space-y-4">
          <FiStar className="text-6xl text-brand-purple mx-auto opacity-50" />
          <h2 className="text-2xl font-bold text-gray-700">{t('noHistory')}</h2>
          <p className="text-gray-500">{t('noHistoryDesc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {history.map((record) => (
            <div key={record.id} className="card hover:border-brand-purple transition-colors group flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold truncate pr-2">{record.session.quiz.title}</h3>
                  <span className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap">
                    {record.session.code}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  {t('playedAs')} <span className="font-bold text-gray-700">{record.nickname}</span>
                </p>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-brand-purple">
                  <FiAward className="text-xl" />
                  <span className="font-black text-xl">{record.score}</span>
                  <span className="text-sm font-bold opacity-70">pts</span>
                </div>
                
                <div className="flex items-center gap-1 text-gray-400 text-sm font-medium">
                  <FiClock />
                  {record.session.startedAt ? new Date(record.session.startedAt).toLocaleDateString() : 'Unknown date'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
