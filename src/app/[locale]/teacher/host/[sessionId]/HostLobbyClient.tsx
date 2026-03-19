"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { startGameAction, endGameAction, updateSessionSettingsAction, getSessionStatus } from "@/app/actions/live";
import { kickParticipantAction } from "@/app/actions/play";
import QRCodeDisplay from "@/components/QRCodeDisplay";

export default function HostLobbyClient({ sessionId, initialSession, initialParticipants }: any) {
  const [session, setSession] = useState(initialSession);
  const [participants, setParticipants] = useState(initialParticipants);
  const [isConfiguring, setIsConfiguring] = useState(initialSession?.status === "WAITING");
  const [hostUrl, setHostUrl] = useState("");
  const router = useRouter();
  const t = useTranslations("Host");

  useEffect(() => {
    setHostUrl(window.location.host);
  }, []);

  useEffect(() => {
    // Polling every 2 seconds for real-time state sync
    const interval = setInterval(async () => {
      const data = await getSessionStatus(sessionId);
      if (data) {
        setSession(data.session);
        setParticipants(data.participants);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const quiz = session?.quiz;
  const totalQuestions = quiz?.questions?.length || 0;

  // Auto Finish logic
  useEffect(() => {
    if (session?.status === "IN_PROGRESS") {
      const allFinished = participants.length > 0 && participants.every((p: any) => (p.answers?.length || 0) >= totalQuestions);
      if (allFinished) {
        endGameAction(sessionId).then(() => {
          // It will poll and become FINISHED
        });
      }
    }
  }, [participants, session?.status, totalQuestions, sessionId]);

  const handleSettingsChange = async (newFeedbackLevel: string, newRandom: boolean, newTimeoutWait: boolean, newMusicTheme: string) => {
      if (newFeedbackLevel === "SHOW_NOTHING") newRandom = true;
      setSession({...session, feedbackLevel: newFeedbackLevel, randomNicknames: newRandom, timeoutWait: newTimeoutWait, musicTheme: newMusicTheme});
      await updateSessionSettingsAction(sessionId, newFeedbackLevel, newRandom, newTimeoutWait, newMusicTheme);
  }

  const musicSrc = session?.musicTheme && session.musicTheme !== "none" ? `/Music/${session.musicTheme}` : null;
  const shouldPlayMusic = musicSrc && !isConfiguring;

  const handleStart = async () => {
    await startGameAction(sessionId);
  };

  const handleEnd = async () => {
    await endGameAction(sessionId);
  };

  const handleKick = async (pId: string) => {
    if (confirm("Are you sure you want to remove this participant?")) {
      await kickParticipantAction(pId);
      setParticipants(participants.filter((p: any) => p.id !== pId));
    }
  };

  const isDuplicateDevice = (p: any) => {
    if (!p.deviceId || p.deviceId === "unknown") return false;
    return participants.filter((other: any) => other.deviceId === p.deviceId && other.id !== p.id).length > 0;
  };

  let content = null;

  if (session.status === "WAITING") {
    if (isConfiguring) {
      content = (
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col space-y-4 py-8">
          <h1 className="text-5xl font-black text-brand-dark mb-8 text-center drop-shadow-sm">{t("configure")}</h1>
          
          <div className="w-full bg-white rounded-3xl p-8 shadow-sm border-2 border-brand-purple/20 text-left">
            <h2 className="text-2xl font-bold mb-6 text-brand-dark flex items-center gap-2"><span className="text-brand-purple">⚙️</span> {t("settings")}</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t("feedbackLevel")}</label>
                <select 
                   value={session.feedbackLevel || "SHOW_ALL"}
                   onChange={(e) => handleSettingsChange(e.target.value, session.randomNicknames, session.timeoutWait, session.musicTheme || "none")}
                   className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-4 focus:border-brand-purple outline-none font-bold text-gray-700 cursor-pointer transition text-lg"
                >
                   <option value="SHOW_ALL">{t("feedbackAll")}</option>
                   <option value="SHOW_CORRECT_INCORRECT">{t("feedbackPartial")}</option>
                   <option value="SHOW_NOTHING">{t("feedbackNothing")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t("timeoutWaitTitle")}</label>
                <select 
                   value={session.timeoutWait ? "WAIT" : "AUTO"}
                   onChange={(e) => handleSettingsChange(session.feedbackLevel, session.randomNicknames, e.target.value === "WAIT", session.musicTheme || "none")}
                   className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-4 focus:border-brand-purple outline-none font-bold text-gray-700 cursor-pointer transition text-lg"
                >
                   <option value="AUTO">{t("timeoutWaitOption0")}</option>
                   <option value="WAIT">{t("timeoutWaitOption1")}</option>
                </select>
                <p className="text-sm font-bold text-gray-400 mt-2">{t("timeoutWaitDesc")}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t("musicThemeTitle")}</label>
                <select 
                   value={session.musicTheme || "s1.MP3"}
                   onChange={(e) => handleSettingsChange(session.feedbackLevel, session.randomNicknames, session.timeoutWait, e.target.value)}
                   className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-4 focus:border-brand-purple outline-none font-bold text-gray-700 cursor-pointer transition text-lg"
                >
                   <option value="none">{t("musicThemeNone")}</option>
                   <option value="s1.MP3">{t("musicTheme1")}</option>
                   <option value="s2.mp3">{t("musicTheme2")}</option>
                </select>
                <p className="text-sm font-bold text-gray-400 mt-2">{t("musicThemeDesc")}</p>
              </div>
              <div className="flex items-center justify-between bg-gray-50 p-6 rounded-xl border-2 border-gray-200 hover:border-brand-purple/50 transition">
                <div>
                   <p className="font-bold text-gray-800 text-lg">{t("randomNicknames")}</p>
                   <p className="text-gray-500 leading-snug mt-1">{t("randomNicknamesDesc")}</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={session.randomNicknames || session.feedbackLevel === "SHOW_NOTHING"} 
                  disabled={session.feedbackLevel === "SHOW_NOTHING"}
                  onChange={(e) => handleSettingsChange(session.feedbackLevel, e.target.checked, session.timeoutWait, session.musicTheme || "none")}
                  className="w-8 h-8 outline-none accent-brand-purple cursor-pointer"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex gap-4 w-full">
             <button onClick={() => router.push("/teacher/dashboard")} className="btn-secondary flex-1 py-4 text-xl font-bold rounded-2xl">{t("cancel")}</button>
             <button onClick={() => setIsConfiguring(false)} className="bg-brand-purple hover:bg-purple-700 text-white font-black rounded-2xl flex-[2] text-2xl py-4 transition-all hover:scale-[1.02] shadow-md border-b-4 border-purple-900 active:border-b-0 active:translate-y-1">
               {t("continueLobby")} &rarr;
             </button>
          </div>
        </div>
      );
    } else {
      content = (
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col items-center justify-center space-y-4 text-center py-8">
        <style>{`
          #main-nav { display: none !important; }
          #main-sidebar { display: none !important; }
          #main-content { padding: 0 !important; max-width: 100% !important; display: flex; flex-direction: column; min-height: 100vh;}
        `}</style>

        <h1 className="text-6xl font-black text-brand-dark mb-4 drop-shadow-md">{t("joinGame")}</h1>
        <p className="text-2xl text-gray-500 font-medium tracking-wide mt-4 mb-8">{t("enterCodeAt")} <strong>{hostUrl ? `${hostUrl}/join` : "..."}</strong></p>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 w-full max-w-5xl px-4">
          <div className="scale-110 md:scale-125 origin-center shrink-0">
            <QRCodeDisplay code={session.code} />
          </div>

          <div className="bg-white border-4 border-brand-purple rounded-3xl py-8 px-6 md:px-12 shadow-2xl relative w-full max-w-lg flex items-center justify-center">
            <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-brand-purple tracking-[0.1em] ml-2 leading-none drop-shadow-md text-center">
              {session.code}
            </div>
          </div>
        </div>

        <div className="w-full bg-white rounded-3xl p-8 mt-8 shadow-sm border-2 border-gray-100">
          <p className="text-gray-500 font-bold mb-6 uppercase tracking-wider flex items-center justify-between text-xl border-b-2 border-gray-100 pb-4">
            <span className="text-brand-dark">{t("playersJoined", { count: participants.length })}</span>
            {session.randomNicknames && <span className="text-brand-purple bg-brand-light px-4 py-2 rounded-full">{t("nicknamesHidden")}</span>}
          </p>
          <div className="flex flex-wrap gap-4 justify-center min-h-[6rem] items-center">
            {participants.length === 0 && <span className="text-gray-400 font-medium text-xl animate-pulse">{t("waitingPlayers")}</span>}
            {participants.map((p: any) => (
              <div 
                key={p.id} 
                className="bg-brand-purple text-white font-bold pl-6 pr-3 py-3 rounded-full text-2xl shadow-md whitespace-nowrap overflow-hidden text-ellipsis border-2 border-purple-700 transform transition animate-bounce-in flex items-center gap-2 group"
              >
                <span>{session.randomNicknames ? p.randomName : p.nickname}</span>
                {isDuplicateDevice(p) && <span title={t("duplicateDeviceWarning")} className="text-xl cursor-help">⚠️</span>}
                <button 
                  onClick={() => handleKick(p.id)}
                  title={t("kickParticipant")}
                  className="ml-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-inner border border-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex gap-4 w-full max-w-2xl px-4">
           <button onClick={() => setIsConfiguring(true)} className="btn-secondary flex-1 py-6 text-2xl font-bold bg-white">&larr; {t("backSettings")}</button>
           <button onClick={handleStart} disabled={participants.length === 0} className="btn-success flex-[2] text-4xl py-6 disabled:opacity-50 drop-shadow-lg shadow-brand-green/50">
             {t("startGame")}
           </button>
        </div>
      </div>
      );
    }
  } else if (session.status === "IN_PROGRESS") {
    content = (
      <div className="max-w-4xl mx-auto w-full text-center space-y-8 py-12 flex-1 flex flex-col">
        <style>{`
          #main-nav { display: none !important; }
          #main-sidebar { display: none !important; }
          #main-content { padding: 2rem !important; }
        `}</style>
        <div className="flex justify-between items-center w-full">
           <div>
             <h1 className="text-4xl font-black text-brand-purple text-left">{t("liveGameplay")}</h1>
             <p className="text-lg font-medium text-gray-500 text-left">{t("liveGameplayDesc")}</p>
           </div>
           <button onClick={handleEnd} className="btn-secondary text-red-500 hover:text-red-700 hover:border-red-200 hover:bg-red-50 px-8 font-bold">{t("endEarly")}</button>
        </div>
        
        <div className="w-full bg-white rounded-3xl p-8 mt-8 shadow-sm text-left border-4 border-gray-100 flex-1">
          <h2 className="text-3xl font-black mb-6 text-brand-dark">{t("liveLeaderboard")}</h2>
          <div className="space-y-4">
             {[...participants].sort((a,b)=>b.score - a.score).map((p, i) => {
                const progress = p.answers?.length || 0;
                const progressPercent = (progress / totalQuestions) * 100;
                return (
                  <div key={p.id} className="flex flex-col bg-gray-50 p-5 rounded-2xl border-2 border-gray-200 shadow-sm transition-all hover:scale-[1.01] overflow-hidden relative">
                    <div className="absolute top-0 left-0 bottom-0 bg-brand-green/10 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                    <div className="relative flex justify-between items-center z-10 w-full">
                      <div className="flex flex-col">
                        <span className="font-bold text-2xl text-gray-700 flex items-center gap-2">
                          <button 
                            onClick={() => handleKick(p.id)}
                            title={t("kickParticipant")}
                            className="bg-red-100 hover:bg-red-500 hover:text-white text-red-500 rounded-lg p-1 transition"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                          </button>
                          {i+1}. {session.randomNicknames ? p.randomName : p.nickname}
                          {isDuplicateDevice(p) && <span title={t("duplicateDeviceWarning")} className="text-xl cursor-help">⚠️</span>}
                        </span>
                        <span className="text-sm font-bold text-gray-500 mt-1">{t("answered", { done: progress, total: totalQuestions })}</span>
                      </div>
                      <span className="font-black text-3xl text-brand-purple bg-white px-4 py-2 rounded-xl shadow-sm border-2 border-gray-100">{p.score} {t("pts")}</span>
                    </div>
                  </div>
                );
             })}
          </div>
        </div>
      </div>
    );
  } else if (session.status === "FINISHED") {
    const sorted = [...participants].sort((a,b)=>b.score - a.score);
    const winner = sorted[0];

    content = (
      <div className="max-w-4xl mx-auto w-full text-center space-y-8 py-12">
        <style>{`
          #main-nav { display: none !important; }
          #main-sidebar { display: none !important; }
          #main-content { padding: 2rem !important; }
        `}</style>
        <h1 className="text-6xl font-black text-brand-dark drop-shadow-sm">{t("gameOver")}</h1>
        {winner && (
          <div className="bg-gradient-to-tr from-brand-yellow to-brand-green rounded-3xl p-8 shadow-xl text-white my-8 transform rotate-1 scale-105">
            <h2 className="text-3xl font-bold opacity-90">🏆 {t("winner")}</h2>
            <p className="text-6xl font-black mt-2 drop-shadow-md">{session.randomNicknames ? winner.randomName : winner.nickname} - {winner.score} {t("pts")}</p>
          </div>
        )}
         <div className="w-full bg-white rounded-3xl p-8 mt-8 shadow-sm text-left border-4 border-gray-100">
          <h2 className="text-2xl font-bold mb-4">{t("finalLeaderboard")}</h2>
           <div className="space-y-3">
             {sorted.map((p, i) => (
                <div key={p.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border-2 border-gray-100 hover:border-gray-200 transition group">
                  <span className="font-bold text-xl flex items-center gap-2">
                    <button 
                      onClick={() => handleKick(p.id)}
                      title={t("kickParticipant")}
                      className="bg-red-100 hover:bg-red-500 hover:text-white text-red-500 rounded-lg p-1 transition opacity-0 group-hover:opacity-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                    {i+1}. {session.randomNicknames ? p.randomName : p.nickname}
                    {isDuplicateDevice(p) && <span title={t("duplicateDeviceWarning")} className="cursor-help">⚠️</span>}
                  </span>
                  <span className="font-bold text-brand-purple">{p.score} {t("pts")}</span>
                </div>
             ))}
          </div>
        </div>
        <button onClick={() => router.push("/teacher/dashboard")} className="btn-primary mt-8">{t("backDashboard")}</button>
      </div>
    );
  }

  return (
    <>
      {shouldPlayMusic && <audio src={musicSrc as string} autoPlay loop />}
      {content}
    </>
  );
}
