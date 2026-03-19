import { Inter } from "next/font/google";
import "../globals.css";
import { Link } from "@/i18n/routing";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import TeacherSidebar from "@/components/TeacherSidebar";
import { FiLogOut } from "react-icons/fi";
import { db } from "@/lib/db";
import { usersTable } from "@/lib/schema";
import { eq } from "drizzle-orm";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Quizz",
  description: "Create and play interactive quizzes",
  icons: {
    icon: "/Picture/logo/1.jpg",
  },
};

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  // Await params first since Next.js 15+ needs params to be awaited conceptually, though in Next.js 14 it isn't strict. Wait, Next.js 15 requires async params access.
  const locale = (await params).locale;
  const session = await getSession();
  let dbUser: any = null;
  if (session?.id) {
    dbUser = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, session.id)
    });
  }

  const messages = await getMessages();
  const t = await getTranslations("Navbar");

  return (
    <html lang={locale}>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <NextIntlClientProvider messages={messages}>
          <nav id="main-nav" className="bg-white border-b-2 border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
            <Link href="/" className="flex items-center gap-2">
              <img src="/Picture/logo/2.jpg" alt="Quizz Logo" className="h-8 md:h-10 w-auto object-contain" />
            </Link>
            <div className="flex gap-4 items-center">
              <LanguageSwitcher />
              {session ? (
                <>
                  <div className="flex items-center gap-3">
                    {session.role === "STUDENT" && (
                       <Link href="/student/history" className="text-gray-600 hover:text-brand-purple font-semibold hidden md:inline-block mr-2">{t("history")}</Link>
                    )}
                    <Link href="/join" className="text-gray-600 hover:text-brand-purple font-semibold hidden md:inline-block mr-2">{t("joinGame")}</Link>
                    
                    {dbUser?.avatar ? (
                      <img src={dbUser.avatar} alt="Avatar" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-brand-purple/50 shadow-sm" />
                    ) : (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-brand-purple to-pink-500 flex items-center justify-center text-white font-bold shadow-sm">
                        {dbUser?.name?.charAt(0) || "U"}
                      </div>
                    )}
                    <span className="font-bold text-gray-700 hidden sm:inline-block">
                      {t("hi", { name: dbUser?.name || session.name })}
                    </span>
                  </div>
                  <form action={logoutAction}>
                    <button type="submit" title={t("logout")} className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 sm:px-3 sm:py-1.5 rounded-lg transition-colors flex items-center gap-2">
                       <FiLogOut className="text-xl" />
                       <span className="font-bold hidden sm:inline-block">{t("logout")}</span>
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/join" className="text-gray-600 hover:text-brand-purple font-semibold flex items-center">
                    {t("enterCode")}
                  </Link>
                  <Link href="/login" className="text-brand-purple bg-brand-light px-4 py-2 rounded-lg font-bold hover:bg-opacity-80 transition">
                    {t("loginRegister")}
                  </Link>
                </>
              )}
            </div>
          </nav>
          
          <div className="flex-1 flex">
            {session && session.role === "TEACHER" && (
              <TeacherSidebar tDashboard={t("dashboard")} tSettings={t("settings")} />
            )}
            {session && session.role === "ADMIN" && (
              <div className="w-64 bg-gray-900 text-white flex-shrink-0 flex flex-col items-center py-6 gap-4 sticky top-[72px] h-[calc(100vh-72px)] hidden md:flex z-10 shadow-xl overflow-y-auto">
                 <h3 className="font-black uppercase tracking-widest text-sm mb-2 border-b-2 border-gray-800 w-full text-center pb-4 text-red-500">Admin Control</h3>
                 <Link href="/admin/dashboard" className="w-4/5 text-center font-bold py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm tracking-wide flex items-center justify-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                     <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                   </svg>
                   Users & Quizzes
                 </Link>
              </div>
            )}
            <main id="main-content" className="flex-1 flex flex-col p-4 sm:p-6 min-w-0 w-full">
              {children}
            </main>
          </div>

          {/* Global Footer */}
          <footer id="main-footer" className="bg-white border-t-2 border-gray-100 py-8 mt-auto text-center z-40 relative px-6 w-full shrink-0">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <img src="/Picture/logo/2.jpg" alt="Quizz Logo" className="h-6 w-auto object-contain grayscale opacity-60" />
                <span className="text-gray-400 font-bold text-sm tracking-wide">© {new Date().getFullYear()} Quizz Platform. All rights reserved.</span>
              </div>
              <div className="text-gray-400 text-sm font-medium">
                Developed for interactive learning and assessment.
              </div>
            </div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
