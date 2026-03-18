"use client";

import { useState, Suspense, useEffect } from "react";
import { joinQuizWithNicknameAction } from "@/app/actions/play";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

function JoinQuizForm() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Join");
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || "";
  const [code, setCode] = useState(initialCode);
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialCode) setCode(initialCode);
  }, [initialCode]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !nickname.trim()) return;

    let deviceId = localStorage.getItem("quizz_device_id");
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("quizz_device_id", deviceId);
    }

    setLoading(true);
    setError(null);
    const res = await joinQuizWithNicknameAction(code.trim(), nickname.trim(), deviceId);

    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else if (res.success) {
      router.push(`/${locale}/play/${res.sessionId}/${res.participantId}`);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 min-h-[70vh]">
      <style>{`
        #main-nav { display: none !important; }
        #main-sidebar { display: none !important; }
        #main-content { padding: 0 !important; max-width: 100% !important; display: flex; flex-direction: column; min-height: 100vh;}
      `}</style>
      <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full border-4 border-gray-100 text-center space-y-8">
        <h1 className="text-4xl font-black text-brand-purple">{t('title')}</h1>
        
        <form onSubmit={handleJoin} className="space-y-6">
          {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg font-bold">{error}</div>}
          
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t('gameCodePlaceholder')}
            className="w-full text-center text-3xl font-black bg-gray-50 border-4 border-gray-200 rounded-2xl px-6 py-6 focus:border-brand-purple outline-none uppercase tracking-widest"
            maxLength={6}
          />

          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={t('nicknamePlaceholder')}
            className="w-full text-center text-2xl font-bold bg-gray-50 border-4 border-gray-200 rounded-2xl px-6 py-5 focus:border-brand-purple outline-none"
            maxLength={20}
          />
          
          <button
            type="submit"
            disabled={loading || code.length < 3 || nickname.length < 2}
            className="btn-primary w-full text-2xl py-5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('joiningBtn') : t('joinBtn')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function JoinQuiz() {
  const t = useTranslations("Join");
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center">{t('loading')}</div>}>
      <JoinQuizForm />
    </Suspense>
  );
}
