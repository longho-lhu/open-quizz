"use client";

import { useEffect, useState, useRef } from "react";
import { getParticipantState, submitAnswerAction, submitTimeoutAction } from "@/app/actions/play";
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
    setTimeLeft(timeLimitMs);
  }, [currentIdx, timeLimitMs]);

  useEffect(() => {
    const status = data?.session?.status;
    const timeoutWait = data?.session?.timeoutWait;
    
    if (status === "IN_PROGRESS" && !feedback && quiz) {
      if (currentIdx < quiz.questions.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            const newTime = prev - 50;
            if (newTime <= 0) {
              if (timerRef.current) clearInterval(timerRef.current);
              if (!timeoutWait) handleTimeout();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.session?.status, currentIdx, feedback]);

  const nextQuestion = () => {
    setFeedback(null);
    setCurrentIdx(prev => prev + 1);
  };

  const handleTimeout = async () => {
     if (answering) return;
     setFeedback({ isTimeout: true });
     if (data?.participant?.id && quiz?.questions?.[currentIdx]?.id) {
       submitTimeoutAction(data.participant.id, quiz.questions[currentIdx].id);
     }
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
    const rank = data.leaderboard?.findIndex((p: any) => p.id === participant.id) + 1;
    const correctCount = data.answers?.filter((a: any) => a.isCorrect).length || 0;
    const totalCount = quiz?.questions?.length || 0;
    const incorrectCount = totalCount - correctCount;

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-5xl font-black text-brand-dark mb-4 drop-shadow-sm">{t("allDone")}</h1>
        {session?.feedbackLevel === "SHOW_NOTHING" ? (
             <p className="text-gray-500 font-bold text-xl mt-6">{t("examModeOn")}</p>
        ) : (
           <>
             <div className="flex items-center gap-4 sm:gap-8 justify-center mb-4 w-full max-w-lg">
                <div className="flex-1 flex flex-col items-center bg-white border-4 border-gray-100 rounded-3xl p-6 shadow-sm">
                   <span className="text-gray-400 font-bold mb-2 uppercase tracking-wide text-sm">{t("yourScore")}</span>
                   <div className="text-brand-purple text-4xl sm:text-5xl font-black drop-shadow-sm">
                       {participant.score} <span className="text-xl">{t("pts")}</span>
                   </div>
                </div>
                <div className="flex-1 flex flex-col items-center bg-white border-4 border-gray-100 rounded-3xl p-6 shadow-sm">
                   <span className="text-gray-400 font-bold mb-2 uppercase tracking-wide text-sm">{t("yourRank")}</span>
                   <div className="text-brand-yellow text-4xl sm:text-5xl font-black drop-shadow-sm">
                       #{rank || "?"}
                   </div>
                </div>
             </div>

             <div className="flex items-center gap-4 sm:gap-8 justify-center mb-8 w-full max-w-lg">
                <div className="flex-1 flex flex-col items-center bg-brand-green/10 border-4 border-brand-green/20 rounded-3xl p-4 sm:p-6 shadow-sm">
                   <span className="text-brand-green font-bold mb-1 uppercase tracking-wide text-sm">{t("correct") || "Correct"}</span>
                   <div className="text-brand-green text-3xl sm:text-4xl font-black drop-shadow-sm">
                       {correctCount}
                   </div>
                </div>
                <div className="flex-1 flex flex-col items-center bg-red-50 border-4 border-red-100 rounded-3xl p-4 sm:p-6 shadow-sm">
                   <span className="text-red-500 font-bold mb-1 uppercase tracking-wide text-sm">{t("incorrect") || "Incorrect"}</span>
                   <div className="text-red-500 text-3xl sm:text-4xl font-black drop-shadow-sm">
                       {incorrectCount}
                   </div>
                </div>
             </div>

             <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-md text-left border-4 border-gray-100 mt-4 max-h-64 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4 text-gray-800">{t("leaderboard")}</h2>
                {data.leaderboard?.map((p: any, i: number) => (
                   <div key={p.id} className={`flex justify-between items-center p-4 rounded-2xl mb-3 font-bold ${p.id === participant.id ? 'bg-brand-purple text-white shadow-md transform scale-[1.02] transition border-none' : 'bg-gray-50 text-gray-700 border-2 border-gray-100'}`}>
                      <span className="flex items-center gap-3">
                        <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${p.id === participant.id ? 'bg-white text-brand-purple' : 'bg-gray-200 text-gray-500'}`}>{i+1}</span>
                        {session.randomNicknames ? p.randomName : p.nickname}
                      </span>
                      <span>{p.score} {t("pts")}</span>
                   </div>
                ))}
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
      if (answering || feedback) return;
      
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
      <div className="flex-1 flex flex-col p-3 md:p-6 max-w-4xl mx-auto w-full h-[100dvh] md:h-auto max-h-[100dvh] justify-center overflow-hidden">
          <div className="flex justify-between items-center mb-3 md:mb-4 shrink-0">
            <span className="font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full border-2 border-gray-200 shadow-sm text-sm">{currentIdx + 1} / {quiz.questions.length}</span>
            <span className="font-black text-brand-purple text-xl">{participant.score} {t("pts")}</span>
         </div>
         
         <div className="w-full bg-gray-200 h-4 md:h-5 rounded-full overflow-hidden mb-4 shadow-inner relative shrink-0">
            <div 
              className={`h-full transition-all duration-75 ${progressPercent < 30 ? 'bg-red-500' : 'bg-brand-purple'}`}
              style={{ width: `${progressPercent}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center font-bold text-[10px] text-white mix-blend-difference drop-shadow-md">
               {Math.ceil(timeLeft / 1000)}s
            </div>
         </div>
         
         <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-4 border-4 border-brand-purple text-center relative flex flex-col items-center justify-center shrink-0 min-h-[100px] md:min-h-[120px]">
            {question.imageUrl && (
              <img src={question.imageUrl} alt="Question" className="max-h-32 sm:max-h-48 w-auto object-contain mb-4 rounded-xl shadow-sm border-2 border-gray-100" />
            )}
            <h2 className={`${question.text?.length > 80 ? 'text-lg sm:text-xl md:text-2xl' : 'text-xl sm:text-2xl md:text-3xl'} font-black leading-tight text-gray-800 line-clamp-4`}>{question.text}</h2>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 flex-1 drop-shadow-sm min-h-0 pb-4">
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
                  disabled={answering}
                  onClick={() => handleOptionSelect(opt.id)}
                  className={`${colorClass} text-white text-xl md:text-3xl font-black p-4 rounded-2xl md:rounded-3xl border-b-4 md:border-b-8 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center break-words drop-shadow-md h-full min-h-[60px] md:min-h-[80px]`}>
                  <span className="drop-shadow-md line-clamp-3">{opt.text}</span>
                </button>
              );
           })}
         </div>
      </div>
    );
  }
}
