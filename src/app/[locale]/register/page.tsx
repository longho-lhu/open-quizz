"use client";

import { registerAction } from "@/app/actions/auth";
import { Link } from "@/i18n/routing";
import { useTransition, useState } from "react";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
  const [isPending, startTransition] = useTransition();
  const [showVerifyPrompt, setShowVerifyPrompt] = useState(false);
  const t = useTranslations("Register");
  
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    startTransition(() => {
      registerAction(formData)
        .then((res) => { 
          if (res?.error) alert(res.error); 
          if (res?.requireVerification) setShowVerifyPrompt(true);
        })
        .catch(err => console.error(err));
    });
  }

  if (showVerifyPrompt) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl border-4 border-gray-100 text-center">
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-brand-dark mb-4">Kiểm tra Email</h2>
          <p className="text-gray-600 mb-6 font-medium leading-relaxed">
            Chúng tôi đã gửi một đường link xác thực đến email của bạn. Vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam) để hoàn tất đăng ký.
          </p>
          <Link href="/login" className="bg-brand-purple hover:bg-brand-purple/90 text-white font-bold py-3 px-4 rounded-xl block w-full transition border-b-4 border-purple-800 active:border-b-0 active:translate-y-1">Quay lại Đăng nhập</Link>
        </div>
      </div>
    );
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
