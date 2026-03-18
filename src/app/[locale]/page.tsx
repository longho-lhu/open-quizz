import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const t = await getTranslations("Home");
  const session = await getSession();

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-12 py-10 overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-brand-yellow rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 right-10 w-32 h-32 bg-brand-green rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-40 w-32 h-32 bg-brand-purple rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      
      <div className="text-center space-y-4 relative">
        <h1 className="text-5xl md:text-7xl font-black text-brand-dark tracking-tighter mix-blend-multiply flex flex-col md:flex-row gap-4 items-center justify-center">
          <span className="text-brand-purple drop-shadow-sm">{t('title')}</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 font-medium max-w-2xl mx-auto pt-4 relative z-10 px-4">
          {t('subtitle')}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg px-4 relative z-10 mt-8">
        <Link href={session?.role === "TEACHER" ? "/teacher/dashboard" : "/login"} className="btn-primary flex-1 text-center py-5 text-xl flex items-center justify-center gap-2 group">
          <span className="text-2xl group-hover:scale-110 transition-transform">👩‍🏫</span>
          {t('teacherButton')}
        </Link>
        <Link href="/join" className="btn-secondary flex-1 text-center py-5 text-xl flex items-center justify-center gap-2 group">
          <span className="text-2xl group-hover:scale-110 transition-transform">🎓</span>
          {t('studentButton')}
        </Link>
      </div>
    </div>
  );
}
