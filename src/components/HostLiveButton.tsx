"use client";
import { hostQuizAction } from "@/app/actions/live";
import { useRouter } from "@/i18n/routing";
import { useState } from "react";

export default function HostLiveButton({ quizId }: { quizId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleHost = async () => {
    setLoading(true);
    const sessionId = await hostQuizAction(quizId);
    router.push(`/teacher/host/${sessionId}`);
  };

  return (
    <button 
      onClick={handleHost}
      disabled={loading}
      className="text-brand-purple hover:bg-brand-purple/10 px-4 py-1.5 rounded-full font-bold transition disabled:opacity-50 border-2 border-brand-purple hover:bg-brand-purple hover:text-white"
    >
      {loading ? "Starting..." : "Host Live"}
    </button>
  );
}
