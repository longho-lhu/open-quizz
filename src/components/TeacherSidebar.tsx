"use client";

import { Link, usePathname } from "@/i18n/routing";
import { FiHome, FiClock, FiSettings } from "react-icons/fi";

export default function TeacherSidebar({ tDashboard, tSettings }: { tDashboard: string, tSettings: string }) {
  const pathname = usePathname();

  // Hide sidebar if we are on the home screen
  if (pathname === "/") {
    return null;
  }

  return (
    <aside id="main-sidebar" className="w-16 sm:w-48 md:w-64 bg-white border-r-2 border-gray-100 flex flex-col py-6 px-2 sm:px-4 gap-2 shrink-0 sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto group">
      <Link href="/teacher/dashboard" title={tDashboard} className={`hover:text-brand-purple hover:bg-brand-light/50 font-bold px-2 sm:px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${pathname.startsWith("/teacher/dashboard") || pathname.startsWith("/teacher/quiz") ? "text-brand-purple bg-brand-light" : "text-gray-600"}`}>
        <FiHome className="text-2xl shrink-0" />
        <span className="hidden sm:inline-block">{tDashboard}</span>
      </Link>
      <Link href="/teacher/sessions" title="Sessions History" className={`hover:text-brand-purple hover:bg-brand-light/50 font-bold px-2 sm:px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${pathname.startsWith("/teacher/sessions") ? "text-brand-purple bg-brand-light" : "text-gray-600"}`}>
        <FiClock className="text-2xl shrink-0" /> 
        <span className="hidden sm:inline-block">Sessions History</span>
      </Link>
      <Link href="/teacher/settings" title={tSettings} className={`hover:text-brand-purple hover:bg-brand-light/50 font-bold px-2 sm:px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${pathname.startsWith("/teacher/settings") ? "text-brand-purple bg-brand-light" : "text-gray-600"}`}>
        <FiSettings className="text-2xl shrink-0" /> 
        <span className="hidden sm:inline-block">{tSettings}</span>
      </Link>
    </aside>
  );
}
