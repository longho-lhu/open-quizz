import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const t = await getTranslations("Home");
  const session = await getSession();

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-yellow rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-brand-green rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" style={{ animationDelay: "2s" }}></div>
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-brand-purple rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" style={{ animationDelay: "4s" }}></div>
      
      <div className="text-center space-y-6 relative z-10 max-w-3xl mx-auto flex flex-col items-center">
        <div className="flex justify-center items-center drop-shadow-md bg-white/50 backdrop-blur-md rounded-3xl p-6 border-2 border-white/60 mb-4 inline-block">
          <img src="/Picture/logo/2.jpg" alt="Quizz Logo" className="h-20 sm:h-24 md:h-28 w-auto object-contain mix-blend-multiply" />
        </div>
        
        <p className="text-lg sm:text-xl md:text-2xl text-gray-700 font-medium leading-relaxed max-w-2xl text-balance">
          {t('subtitle')}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg mt-12 relative z-10">
        <Link 
          href={session?.role === "TEACHER" ? "/teacher/dashboard" : "/login"} 
          className="btn-primary flex-1 text-center py-4 text-lg sm:text-xl flex items-center justify-center gap-3 group"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform origin-center">👩‍🏫</span>
          {t('teacherButton')}
        </Link>
        <Link 
          href="/join" 
          className="btn-secondary flex-1 text-center py-4 text-lg sm:text-xl flex items-center justify-center gap-3 group bg-white"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform origin-center">🎓</span>
          {t('studentButton')}
        </Link>
      </div>
    </div>
  );
}
