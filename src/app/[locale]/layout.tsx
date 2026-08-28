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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "Open quizz",
  description: "Nền tảng tạo và tham gia trả lời câu hỏi trắc nghiệm tương tác trực tuyến.",
  icons: {
    icon: "/Picture/logo/1.jpg",
  },
  openGraph: {
    title: "Open quizz",
    description: "Nền tảng tạo và tham gia trả lời câu hỏi trắc nghiệm tương tác trực tuyến.",
    siteName: "Open quizz",
    images: [
      {
        url: "/Picture/logo/2.jpg",
        width: 1200,
        height: 630,
        alt: "Open quizz Logo",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Open quizz",
    description: "Nền tảng tạo và tham gia trả lời câu hỏi trắc nghiệm tương tác trực tuyến.",
    images: ["/Picture/logo/2.jpg"],
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
  const tAdmin = await getTranslations("Admin");

  return (
    <html lang={locale}>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <NextIntlClientProvider messages={messages}>
          <nav id="main-nav" className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
                <img src="/Picture/logo/2.jpg" alt="Quizz Logo" className="h-8 md:h-10 w-auto object-contain" />
              </Link>
              <div className="flex gap-5 items-center">
                <LanguageSwitcher />
                {session ? (
                  <>
                    <div className="flex items-center gap-4">
                      {session.role === "STUDENT" && (
                        <Link href="/student/history" className="text-gray-600 hover:text-brand-purple font-semibold hidden md:inline-block transition-colors">{t("history")}</Link>
                      )}
                      <Link href="/join" className="text-gray-600 hover:text-brand-purple font-semibold hidden md:inline-block transition-colors">{t("joinGame")}</Link>

                      <div className="flex items-center gap-3 bg-gray-50 py-1.5 px-3 rounded-full border border-gray-200">
                        {dbUser?.avatar ? (
                          <img src={dbUser.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-gray-300 shadow-sm" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-purple to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {dbUser?.name?.charAt(0) || "U"}
                          </div>
                        )}
                        <span className="font-bold text-gray-700 hidden sm:inline-block text-sm">
                          {t("hi", { name: dbUser?.name || session.name })}
                        </span>
                      </div>
                    </div>
                    <form action={logoutAction}>
                      <button type="submit" title={t("logout")} className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-colors flex items-center justify-center">
                        <FiLogOut className="text-xl" />
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/join" className="text-gray-600 hover:text-brand-purple font-semibold flex items-center transition-colors">
                      {t("enterCode")}
                    </Link>
                    <Link href="/login" className="text-brand-purple bg-brand-light px-5 py-2 rounded-xl font-bold hover:bg-brand-purple hover:text-white transition-all shadow-sm">
                      {t("loginRegister")}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>

          <div className="flex-1 flex w-full">
            {session && session.role === "TEACHER" && (
              <TeacherSidebar tDashboard={t("dashboard")} tSettings={t("settings")} />
            )}
            {session && session.role === "ADMIN" && (
              <div className="w-16 md:w-64 bg-gray-900 text-white flex-shrink-0 flex flex-col items-center py-6 gap-4 sticky top-[73px] h-[calc(100vh-73px)] z-10 shadow-xl overflow-y-auto group">
                <h3 className="font-black uppercase tracking-widest text-xs md:text-sm mb-2 border-b-2 border-gray-800 w-full text-center pb-4 text-red-500 hidden md:block">{tAdmin("controlPanel")}</h3>
                <h3 className="font-black uppercase text-xs mb-2 border-b-2 border-gray-800 w-full text-center pb-4 text-red-500 block md:hidden">CP</h3>
                <Link href="/admin/dashboard" title={tAdmin("dashboard")} className="w-12 md:w-4/5 text-center font-bold py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm tracking-wide flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-5 md:w-5 text-gray-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                  </svg>
                  <span className="hidden md:inline-block">{tAdmin("dashboard")}</span>
                </Link>
                <Link href="/admin/users" title={tAdmin("users")} className="w-12 md:w-4/5 text-center font-bold py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm tracking-wide flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-5 md:w-5 text-gray-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  <span className="hidden md:inline-block">{tAdmin("users")}</span>
                </Link>
                <Link href="/admin/quizzes" title={tAdmin("quizzes")} className="w-12 md:w-4/5 text-center font-bold py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm tracking-wide flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-5 md:w-5 text-gray-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="hidden md:inline-block">{tAdmin("quizzes")}</span>
                </Link>
              </div>
            )}
            <main id="main-content" className="flex-1 flex flex-col min-w-0 w-full relative p-4 sm:p-6 md:p-8">
              {children}
            </main>
          </div>

          {/* Global Footer */}
          <footer id="main-footer" className="bg-white border-t border-gray-200 py-6 mt-auto z-40 relative w-full shrink-0">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <img src="/Picture/logo/2.jpg" alt="Quizz Logo" className="h-5 w-auto object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" />
                <span className="text-gray-500 font-medium text-sm tracking-wide">© {new Date().getFullYear()} Quizz Platform.</span>
              </div>
              <div className="text-gray-400 text-sm font-medium">
                Developed by Faculty of Information Technology, Lac Hong University
              </div>
            </div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
