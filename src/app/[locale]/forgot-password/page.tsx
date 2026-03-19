"use client";

import { forgotPasswordAction } from "@/app/actions/auth";
import { Link } from "@/i18n/routing";
import { useTransition, useState } from "react";

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    startTransition(() => {
      forgotPasswordAction(formData)
        .then((res) => { 
          if (res?.error) alert(res.error); 
          if (res?.success) setSuccess(true);
        })
        .catch(err => console.error(err));
    });
  }

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl border-4 border-gray-100 text-center">
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-black text-brand-dark mb-4">Gửi link thành công</h2>
          <p className="text-gray-600 mb-6 font-medium leading-relaxed">
            Nếu địa chỉ email này tồn tại trong hệ thống, chúng tôi đã gửi một đường link khôi phục mật khẩu. Vui lòng kiểm tra email của bạn để lấy lại quyền truy cập.
          </p>
          <Link href="/login" className="bg-brand-purple hover:bg-brand-purple/90 text-white font-bold py-3 px-4 rounded-xl block w-full transition border-b-4 border-purple-800 active:border-b-0 active:translate-y-1">Quay lại Đăng nhập</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl border-4 border-gray-100">
        <h1 className="text-3xl font-black text-brand-purple mb-6 text-center">Quên Mật Khẩu</h1>
        <p className="text-gray-500 mb-6 text-center font-medium text-sm leading-relaxed">Nhập địa chỉ email của bạn để nhận đường link khôi phục mật khẩu. Link có hiệu lực trong 15 phút.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input name="email" type="email" required className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-brand-purple focus:ring-0 outline-none" />
          </div>
          <button type="submit" disabled={isPending} className="bg-brand-purple hover:bg-brand-purple/90 text-white w-full text-xl py-3 mt-4 rounded-xl font-bold transition border-b-4 border-purple-800 active:border-b-0 active:translate-y-1 disabled:opacity-50">
            {isPending ? "Đang gửi..." : "Gửi link khôi phục"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link href="/login" className="text-gray-500 hover:text-brand-purple font-bold text-sm transition">← Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
