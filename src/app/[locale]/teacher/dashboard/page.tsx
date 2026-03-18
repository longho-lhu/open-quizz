import { getQuizzes } from "@/app/actions/quiz";
import { Link } from "@/i18n/routing";
import HostLiveButton from "@/components/HostLiveButton";
import QuizAdminButtons from "@/components/QuizAdminButtons";
import { getTranslations } from "next-intl/server";
import { FiFolder, FiPlusCircle } from "react-icons/fi";

export default async function TeacherDashboard() {
  const t = await getTranslations("Dashboard");
  const quizzes = await getQuizzes();

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-brand-dark">{t("title")}</h1>
          <p className="text-gray-500">Manage your quizzes and track student progress.</p>
        </div>
        <Link href="/teacher/quiz/create" className="btn-primary">
          {t("createBtn")}
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-12 text-center space-y-4">
          <FiFolder className="text-6xl text-brand-purple mx-auto opacity-50" />
          <h2 className="text-2xl font-bold text-gray-700">{t("noQuizzes")}</h2>
          <p className="text-gray-500">Create your first quiz to engage your students!</p>
          <Link href="/teacher/quiz/create" className="btn-primary inline-block mt-4">
            {t("createBtn")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz: any) => (
            <div key={quiz.id} className="card flex flex-col hover:border-brand-purple transition-colors group">
              <div className="h-32 bg-brand-light rounded-xl mb-4 relative flex items-center justify-center border-2 border-brand-purple/20 group-hover:bg-brand-purple/10 transition-colors">
                <span className="text-5xl font-black text-brand-purple opacity-50">Quiz</span>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-3 py-1 rounded-full shadow-sm backdrop-blur-sm border border-brand-purple/20">
                   <QuizAdminButtons quizId={quiz.id} currentTitle={quiz.title} />
                </div>
              </div>
              <h3 className="text-xl font-bold truncate">{quiz.title}</h3>
              <p className="text-gray-500 line-clamp-2 text-sm mt-1 flex-1">
                {quiz.description || "No description provided."}
              </p>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {quiz._count.questions} Questions
                </span>
                <HostLiveButton quizId={quiz.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
