"use client";

import { useEffect, useState, useRef } from "react";
import { getParticipantState, submitAnswerAction } from "@/app/actions/play";
import { useTranslations } from "next-intl";

export default function PlayClient({ sessionId, participantId }: any) {
  const [data, setData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answering, setAnswering] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [feedback, setFeedback] = useState<any>(null);
  const t = useTranslations("Play");
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Polling every 2s to check if Host finished the session early
    const interval = setInterval(async () => {
      const state = await getParticipantState(sessionId, participantId);
      setData(state);
    }, 2000);
    
    // Initial fetch
    getParticipantState(sessionId, participantId).then(setData);
    
    return () => clearInterval(interval);
  }, [sessionId, participantId]);

  const quiz = data?.session?.quiz;
  const questionTimeLimit = quiz && currentIdx < quiz.questions.length ? quiz.questions[currentIdx].timeLimit : 15;
  const timeLimitMs = (questionTimeLimit || 15) * 1000;

  // Local Timer Logic 
  useEffect(() => {
    if (data?.session?.status === "IN_PROGRESS" && !feedback && quiz) {
      if (currentIdx < quiz.questions.length) {
        setTimeLeft(timeLimitMs);
        
        if (timerRef.current) clearInterval(timerRef.current);
        
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            const newTime = prev - 50;
            if (newTime <= 0) {
              if (timerRef.current) clearInterval(timerRef.current);
              handleTimeout();
              return 0;
            }
            return newTime;
          });
        }, 50);
      }
    }
    return () => {
       if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [data?.session?.status, currentIdx, feedback, quiz, timeLimitMs]);

  const nextQuestion = () => {
    setFeedback(null);
    setCurrentIdx(prev => prev + 1);
  };

  const handleTimeout = async () => {
     if (answering) return;
     setFeedback({ isTimeout: true });
     setTimeout(() => {
       nextQuestion();
     }, 3000);
  };

  if (!data) return <div className="p-8 text-center text-xl font-bold text-gray-500 animate-pulse">{t("connecting")}</div>;

  const { session, participant } = data;

  if (session.status === "WAITING") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-4xl font-black text-brand-dark mb-4">{t("youAreIn")}</h1>
        <p className="text-3xl font-black text-white mb-8 bg-brand-purple px-10 py-4 rounded-3xl shadow-xl transform -rotate-2">
           {session.randomNicknames ? participant.randomName : participant.nickname}
        </p>
        <p className="text-2xl text-gray-500 font-medium animate-pulse mt-8">{t("waitingTeacher")}</p>
        <div className="mt-12 spinner"></div>
      </div>
    );
  }

  // If game is over by teacher OR student finished all questions
  if (session.status === "FINISHED" || (quiz && currentIdx >= quiz.questions.length)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-5xl font-black text-brand-dark mb-4 drop-shadow-sm">{t("allDone")}</h1>
        {session?.feedbackLevel === "SHOW_NOTHING" ? (
             <p className="text-gray-500 font-bold text-xl mt-6">{t("examModeOn")}</p>
        ) : (
           <>
             <p className="text-3xl font-bold text-gray-600 mb-8">{t("youScored")}</p>
             <div className="bg-gradient-to-tr from-brand-purple to-pink-500 text-white text-6xl font-black px-12 py-8 rounded-3xl shadow-2xl transform rotate-2 animate-bounce-in">
                {participant.score} {t("pts")}
             </div>
           </>
        )}
        {session.status !== "FINISHED" && (
           <p className="text-xl text-gray-500 font-medium mt-12 animate-pulse">{t("waitingOthers")}</p>
        )}
      </div>
    );
  }

  if (session.status === "IN_PROGRESS") {
    const question = quiz.questions[currentIdx];
    if (!question) return <div>Question not found</div>;

    const progressPercent = (timeLeft / timeLimitMs) * 100;

    const handleOptionSelect = async (optionId: string) => {
      if (answering || timeLeft <= 0 || feedback) return;
      
      if (timerRef.current) clearInterval(timerRef.current);
      setAnswering(true);
      
      const res = await submitAnswerAction(participant.id, question.id, optionId, timeLeft, timeLimitMs);
      
      if (res.success) {
        setFeedback({ isTimeout: false, isCorrect: res.isCorrect, points: res.points });
        // Optimistic UI updates
        participant.score += res.points; 
      } else {
        // If they already answered...
        setFeedback({ isTimeout: false, isCorrect: false, points: 0, error: res.error });
      }
      
      setAnswering(false);
      setTimeout(() => {
        nextQuestion();
      }, 3000);
    };

    if (feedback) {
      if (session?.feedbackLevel === "SHOW_NOTHING") {
        return (
           <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-50">
             <div className="text-center space-y-6 bg-white p-12 rounded-[3rem] shadow-xl border-4 border-gray-100">
                <div className="text-8xl animate-bounce-in">⏳</div>
                <h2 className="text-4xl font-black mb-4">{t("answerLogged")}</h2>
                <div className="inline-block bg-gray-100 text-gray-500 font-bold px-8 py-3 rounded-full mt-4">
                  {t("hiddenFeedback")}
                </div>
             </div>
             <p className="mt-12 text-2xl font-bold text-gray-400 animate-pulse tracking-wide uppercase">{t("getReady")}</p>
           </div>
        );
      }
      
      const correctOpt = question?.options?.find((o: any) => o.isCorrect);

      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-50">
           {!feedback.isTimeout ? (
             <div className="text-center space-y-6 bg-white p-12 rounded-[3rem] shadow-xl border-4 border-gray-100">
                <div className={`text-8xl ${feedback.isCorrect ? 'text-brand-green' : 'text-red-500'} animate-bounce-in`}>
                  {feedback.isCorrect ? '✅' : '❌'}
                </div>
                <h2 className="text-4xl font-black">{feedback.isCorrect ? t("correct") : t("incorrect")}</h2>
                <div className="inline-block bg-brand-light text-brand-purple text-3xl font-black px-8 py-3 rounded-full mt-4">
                  +{feedback.points || 0} {t("pts")}
                </div>
                {session?.feedbackLevel === "SHOW_ALL" && !feedback.isCorrect && correctOpt && (
                  <div className="mt-6 p-4 bg-brand-green/10 border-2 border-brand-green rounded-2xl max-w-[300px] mx-auto">
                    <p className="text-sm font-bold text-brand-green uppercase tracking-wider mb-2">{t("rightAnswerWas")}</p>
                    <p className="text-lg font-bold text-gray-800">{correctOpt.text}</p>
                  </div>
                )}
             </div>
           ) : (
             <div className="text-center space-y-6 bg-white p-12 rounded-[3rem] shadow-xl border-4 border-gray-100">
                <div className="text-8xl animate-pulse">⏰</div>
                <h2 className="text-4xl font-black text-red-500">{t("timesUp")}</h2>
             </div>
           )}
           <p className="mt-12 text-2xl font-bold text-gray-400 animate-pulse tracking-wide uppercase">{t("getReady")}</p>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col p-4 md:p-8 max-w-4xl mx-auto w-full">
          <div className="flex justify-between items-center mb-6">
            <span className="font-bold text-gray-500 bg-gray-100 px-4 py-1.5 rounded-full border-2 border-gray-200 shadow-sm">{currentIdx + 1} / {quiz.questions.length}</span>
            <span className="font-black text-brand-purple text-2xl">{participant.score} {t("pts")}</span>
         </div>
         
         <div className="w-full bg-gray-200 h-6 rounded-full overflow-hidden mb-8 shadow-inner relative">
            <div 
              className={`h-full transition-all duration-75 ${progressPercent < 30 ? 'bg-red-500' : 'bg-brand-purple'}`}
              style={{ width: `${progressPercent}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-white mix-blend-difference drop-shadow-md">
               {Math.ceil(timeLeft / 1000)}s
            </div>
         </div>
         
         <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border-4 border-brand-purple text-center relative min-h-[200px] flex items-center justify-center">
            <h2 className="text-3xl md:text-5xl font-black leading-tight text-gray-800">{question.text}</h2>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1 drop-shadow-sm">
           {question.options.map((opt: any, i: number) => {
              const colors = [
                "bg-red-500 border-red-700 hover:bg-red-400",
                "bg-blue-500 border-blue-700 hover:bg-blue-400",
                "bg-brand-yellow border-yellow-500 hover:bg-yellow-300",
                "bg-brand-green border-green-600 hover:bg-green-400"
              ];
              const colorClass = colors[i % colors.length];

              return (
                <button
                  key={opt.id}
                  disabled={answering || timeLeft <= 0}
                  onClick={() => handleOptionSelect(opt.id)}
                  className={`${colorClass} text-white text-3xl md:text-4xl font-black py-12 px-6 rounded-3xl border-b-8 active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center break-words drop-shadow-md`}
                >
                  <span className="drop-shadow-md">{opt.text}</span>
                </button>
              );
           })}
         </div>
      </div>
    );
  }
}
