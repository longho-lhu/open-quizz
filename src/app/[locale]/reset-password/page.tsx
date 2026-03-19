"use client";

import { resetPasswordAction } from "@/app/actions/auth";
import { Link } from "@/i18n/routing";
import { useTransition, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ResetForm() {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  if (!token) {
    return (
      <div className="text-center p-6">
        <h2 className="text-xl font-bold text-red-500 mb-2">Đường link không hợp lệ</h2>
        <p className="text-gray-500 mb-6 font-medium">Bạn cần nhấn trực tiếp vào đường link trong email.</p>
        <Link href="/login" className="bg-gray-200 text-gray-800 py-2 px-6 rounded-lg font-bold hover:bg-gray-300 transition">Về Đăng nhập</Link>
      </div>
    );
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setErrorMsg("");
    const formData = new FormData(e.target);
    formData.append("token", token);
    
    startTransition(() => {
      resetPasswordAction(formData)
        .then((res) => { 
          if (res?.error) setErrorMsg(res.error); 
          if (res?.success) setSuccess(true);
        })
        .catch(err => {
          console.error(err);
          setErrorMsg("Đã có lỗi xảy ra");
        });
    });
  }

  if (success) {
    return (
      <div className="text-center p-4">
        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-black text-brand-dark mb-4">Khôi phục thành công</h2>
        <p className="text-gray-600 mb-6 font-medium leading-relaxed">
          Mật khẩu của bạn đã được đổi thành công. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.
        </p>
        <Link href="/login" className="bg-brand-purple hover:bg-brand-purple/90 text-white block w-full py-3 rounded-xl font-bold transition border-b-4 border-purple-800 active:border-b-0 active:translate-y-1">Đăng nhập ngay</Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-black text-brand-purple mb-6 text-center">Đổi Mật Khẩu</h1>
      <p className="text-gray-500 mb-6 text-center font-medium text-sm">Vui lòng nhập mật khẩu mới cho tài khoản của bạn.</p>
      
      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold mb-4 text-center border border-red-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu mới</label>
          <input name="password" type="password" required minLength={6} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-brand-purple focus:ring-0 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Xác nhận mật khẩu</label>
          <input name="confirmPassword" type="password" required minLength={6} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-brand-purple focus:ring-0 outline-none" />
        </div>
        <button type="submit" disabled={isPending} className="bg-brand-purple hover:bg-brand-purple/90 text-white w-full text-xl py-3 mt-4 rounded-xl font-bold transition border-b-4 border-purple-800 active:border-b-0 active:translate-y-1 disabled:opacity-50">
          {isPending ? "Đang xử lý..." : "Xác nhận đổi"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl border-4 border-gray-100">
        <Suspense fallback={<div className="text-center font-bold text-gray-500">Đang tải...</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
