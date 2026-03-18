"use client";

import { loginAction } from "@/app/actions/auth";
import { Link } from "@/i18n/routing";
import { useTransition } from "react";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("Login");
  
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    startTransition(() => {
      loginAction(formData)
        .then((res) => { if (res?.error) alert(res.error); })
        .catch(err => console.error(err));
    });
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl border-4 border-gray-100">
        <h1 className="text-3xl font-black text-brand-purple mb-6 text-center">{t('title')}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('email')}</label>
            <input name="email" type="email" required className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-brand-purple focus:ring-0 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('password')}</label>
            <input name="password" type="password" required className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-brand-purple focus:ring-0 outline-none" />
          </div>
          <button type="submit" disabled={isPending} className="btn-primary w-full text-xl py-3 mt-4">
            {isPending ? t('loggingIn') : t('loginBtn')}
          </button>
        </form>
        <p className="text-center font-medium text-gray-500 mt-6">
          {t('noAccount')} <Link href="/register" className="text-brand-purple hover:underline font-bold">{t('signupLink')}</Link>
        </p>
      </div>
    </div>
  );
}
