"use client";

import { registerAction } from "@/app/actions/auth";
import { Link } from "@/i18n/routing";
import { useTransition } from "react";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("Register");
  
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    startTransition(() => {
      registerAction(formData)
        .then((res) => { if (res?.error) alert(res.error); })
        .catch(err => console.error(err));
    });
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl border-4 border-gray-100">
        <h1 className="text-3xl font-black text-brand-green mb-6 text-center">{t('title')}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('fullName')}</label>
            <input name="name" type="text" required className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-brand-green focus:ring-0 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('email')}</label>
            <input name="email" type="email" required className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-brand-green focus:ring-0 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('password')}</label>
            <input name="password" type="password" required className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-brand-green focus:ring-0 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('accountType')}</label>
            <select name="role" className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-brand-green focus:ring-0 outline-none font-bold text-gray-700">
               <option value="STUDENT">{t('studentRole')}</option>
               <option value="TEACHER">{t('teacherRole')}</option>
            </select>
          </div>
          <button type="submit" disabled={isPending} className="btn-success w-full text-xl py-3 mt-4">
            {isPending ? t('creating') : t('signupBtn')}
          </button>
        </form>
        <p className="text-center font-medium text-gray-500 mt-6">
          {t('hasAccount')} <Link href="/login" className="text-brand-purple hover:underline font-bold">{t('loginLink')}</Link>
        </p>
      </div>
    </div>
  );
}
