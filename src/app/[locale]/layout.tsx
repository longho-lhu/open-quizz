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
              <span className="text-2xl font-black text-brand-purple tracking-tight">{t("title")}</span>
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
            <main id="main-content" className="flex-1 flex flex-col p-4 sm:p-6 min-w-0 w-full">
              {children}
            </main>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
