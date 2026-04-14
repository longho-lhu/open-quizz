"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { startGameAction, endGameAction, updateSessionSettingsAction, getSessionStatus, nextQuestionAction, endQuestionEarlyAction } from "@/app/actions/live";
import { kickParticipantAction } from "@/app/actions/play";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import mqtt from "mqtt";

export default function HostLobbyClient({ sessionId, initialSession, initialParticipants }: any) {
  const [session, setSession] = useState(initialSession);
  const [participants, setParticipants] = useState(initialParticipants);
  const [isConfiguring, setIsConfiguring] = useState(initialSession?.status === "WAITING");
  const [hostPhase, setHostPhase] = useState<'QUESTION' | 'RESULT' | 'LEADERBOARD'>('QUESTION');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hostUrl, setHostUrl] = useState("");
  const router = useRouter();
  const t = useTranslations("Host");

  useEffect(() => {
    setHostUrl(window.location.host);
  }, []);

  useEffect(() => {
    // Only fetch state on initial load, and then when socket emits an update
    const fetchState = async () => {
      const data = await getSessionStatus(sessionId);
      if (data) {
        setSession(data.session);
        setParticipants(data.participants);
      }
    };

    fetchState();

    // Fallback slow polling just in case WebSocket disconnects
    const interval = setInterval(fetchState, 15000);

    const mqttUrl = process.env.NEXT_PUBLIC_MQTT_URL || "wss://mqtt.fitlhu.com";
    const client = mqtt.connect(mqttUrl);

    client.on('connect', () => {
      client.subscribe(`session/${sessionId}`);
    });

    client.on('message', (topic, message) => {
      if (topic === `session/${sessionId}`) {
        fetchState();
      }
    });

    return () => {
      clearInterval(interval);
      client.end();
    };
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

  // Host local timer for manual mode
  useEffect(() => {
    if (session?.status === "IN_PROGRESS" && session?.progressionMode === "MANUAL" && hostPhase === "QUESTION") {
      const qTime = quiz?.questions?.[session.currentQuestionIndex]?.timeLimit || 15;
      const timeLimitMs = qTime * 1000;
      const start = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();

      const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - start;
        const remaining = timeLimitMs - elapsed;
        if (remaining <= 0) {
          setTimeLeft(0);
          setHostPhase((prev) => prev === 'QUESTION' ? 'RESULT' : prev);
          clearInterval(interval);
        } else {
          setTimeLeft(remaining);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [session?.status, session?.startedAt, session?.progressionMode, session?.currentQuestionIndex, hostPhase, quiz]);

  const handleSettingsChange = async (newFeedbackLevel: string, newRandom: boolean, newTimeoutWait: boolean, newMusicTheme: string, newProgMode?: string) => {
    if (newFeedbackLevel === "SHOW_NOTHING") newRandom = true;
    const progMode = newProgMode || session.progressionMode || "AUTO";
    setSession({ ...session, feedbackLevel: newFeedbackLevel, randomNicknames: newRandom, timeoutWait: newTimeoutWait, musicTheme: newMusicTheme, progressionMode: progMode });
    await updateSessionSettingsAction(sessionId, newFeedbackLevel, newRandom, newTimeoutWait, newMusicTheme, progMode);
  }

  const musicSrc = session?.musicTheme && session.musicTheme !== "none" ? `/Music/${session.musicTheme}` : null;
  const shouldPlayMusic = musicSrc && !isConfiguring;

  const handleStart = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    await startGameAction(sessionId);
    const data = await getSessionStatus(sessionId);
    if (data) {
      setSession(data.session);
      setParticipants(data.participants);
    }
    setHostPhase('QUESTION');
    setIsProcessing(false);
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
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t("progressionMode")}</label>
                <select
                  value={session.progressionMode || "AUTO"}
                  onChange={(e) => handleSettingsChange(session.feedbackLevel, session.randomNicknames, session.timeoutWait, session.musicTheme || "none", e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-4 focus:border-brand-purple outline-none font-bold text-gray-700 cursor-pointer transition text-lg"
                >
                  <option value="AUTO">{t("progressionAuto")}</option>
                  <option value="MANUAL">{t("progressionManual")}</option>
                </select>
                <p className="text-sm font-bold text-gray-400 mt-2">{t("progressionModeDesc")}</p>
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
    const isManual = session.progressionMode === "MANUAL";
    const currentQ = quiz?.questions?.[session.currentQuestionIndex];
    const timeLimitMs = (currentQ?.timeLimit || 15) * 1000;
    const progressPercent = (timeLeft / timeLimitMs) * 100;

    let manualAnswersCount = 0;
    if (isManual && currentQ) {
      manualAnswersCount = participants.filter((p: any) =>
        p.answers?.some((a: any) => a.questionId === currentQ.id)
      ).length;
    }

    const leaderboardContent = (
      <div className="w-full bg-white rounded-3xl p-8 mt-8 shadow-sm text-left border-4 border-gray-100 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-black text-brand-dark">{t("liveLeaderboard")}</h2>
          {isManual && (
            <button
              disabled={isProcessing}
              onClick={async () => {
                if (session.currentQuestionIndex + 1 < totalQuestions) {
                  setIsProcessing(true);
                  await nextQuestionAction(sessionId, session.currentQuestionIndex + 1);
                  const data = await getSessionStatus(sessionId);
                  if (data) {
                    setSession(data.session);
                    setParticipants(data.participants);
                  }
                  setHostPhase('QUESTION');
                  setIsProcessing(false);
                } else {
                  handleEnd();
                }
              }}
              className={`bg-brand-purple text-white px-6 py-2 rounded-xl font-bold transition flex items-center justify-center gap-2 ${isProcessing ? "opacity-75 cursor-not-allowed" : "hover:bg-purple-700"}`}
            >
              {isProcessing ? <span className="spinner w-4 h-4 mr-2 border-2 text-white border-white border-t-transparent animate-spin rounded-full"></span> : null}
              {t("nextQuestion")}
            </button>
          )}
        </div>
        <div className="space-y-4">
          {[...participants].sort((a, b) => b.score - a.score).map((p, i) => {
            const progress = p.answers?.length || 0;
            const pPercent = (progress / totalQuestions) * 100;
            return (
              <div key={p.id} className="flex flex-col bg-gray-50 p-5 rounded-2xl border-2 border-gray-200 shadow-sm transition-all hover:scale-[1.01] overflow-hidden relative">
                <div className="absolute top-0 left-0 bottom-0 bg-brand-green/10 transition-all duration-500" style={{ width: `${pPercent}%` }}></div>
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
                      {i + 1}. {session.randomNicknames ? p.randomName : p.nickname}
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
    );

    const questionContent = currentQ && (
      <div className="w-full bg-white rounded-3xl p-6 mt-6 shadow-sm text-center border-4 border-gray-100 flex-1 flex flex-col items-center relative overflow-y-auto">
        <div className="absolute top-4 right-4 bg-brand-light text-brand-purple px-4 py-2 rounded-xl font-bold z-10 hidden sm:block">
          Q {session.currentQuestionIndex + 1} / {totalQuestions}
        </div>

        <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden mb-6 shadow-inner relative shrink-0">
          <div
            className={`h-full transition-all duration-75 ${progressPercent < 30 ? 'bg-red-500' : 'bg-brand-purple'}`}
            style={{ width: `${progressPercent}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center font-bold text-[10px] text-white mix-blend-difference drop-shadow-md">
            {Math.ceil(timeLeft / 1000)}s
          </div>
        </div>

        <div className="flex-1 w-full flex flex-col justify-center items-center mb-6 min-h-[120px]">
          {currentQ.imageUrl && (
            <img src={currentQ.imageUrl} alt="Question" className="max-h-32 sm:max-h-48 w-auto object-contain mb-4 rounded-xl shadow-sm border-2 border-gray-100" />
          )}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-800 break-words">{currentQ.text}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 flex-1 drop-shadow-sm min-h-0 w-full mb-8">
          {currentQ.options?.map((opt: any, i: number) => {
            const colors = [
              "bg-red-500 border-red-700",
              "bg-blue-500 border-blue-700",
              "bg-brand-yellow border-yellow-500",
              "bg-brand-green border-green-600"
            ];
            const colorClass = colors[i % colors.length];
            const isResult = hostPhase === 'RESULT';
            const opacityClass = isResult && !opt.isCorrect ? 'opacity-30 grayscale' : 'opacity-95';

            return (
              <div
                key={opt.id}
                className={`${colorClass} ${opacityClass} text-white text-xl md:text-2xl font-black p-4 rounded-2xl md:rounded-3xl border-b-4 md:border-b-8 drop-shadow-md h-full min-h-[60px] md:min-h-[80px] flex items-center justify-center relative transition-all duration-500`}
              >
                <span className="drop-shadow-md line-clamp-3">{opt.text}</span>
                {isResult && opt.isCorrect && <span className="absolute top-2 right-4 text-3xl">✅</span>}
              </div>
            );
          })}
        </div>

        <div className="text-center w-full max-w-sm mx-auto mb-6 bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
          <p className="text-gray-500 font-bold uppercase tracking-wide">{t("answered", { done: manualAnswersCount, total: participants.length })}</p>
          <div className="w-full h-4 bg-gray-200 mt-2 rounded-full overflow-hidden">
            <div className="h-full bg-brand-green transition-all" style={{ width: `${participants.length ? (manualAnswersCount / participants.length) * 100 : 0}%` }}></div>
          </div>
        </div>

        {hostPhase === 'QUESTION' ? (
          <button
            disabled={isProcessing}
            onClick={async () => {
              if (isProcessing) return;
              setIsProcessing(true);
              await endQuestionEarlyAction(sessionId);
              setTimeLeft(0);
              setHostPhase('RESULT');
              setIsProcessing(false);
            }}
            className={`bg-brand-yellow text-brand-dark px-8 py-4 rounded-2xl font-black text-xl shadow-md transition transform flex items-center justify-center gap-2 mx-auto ${isProcessing ? "opacity-75 cursor-not-allowed" : "hover:bg-yellow-400 hover:scale-[1.02]"}`}
          >
            {isProcessing ? <span className="spinner w-5 h-5 mr-1 border-2 text-brand-dark border-brand-dark border-t-transparent animate-spin rounded-full"></span> : null}
            {t.has('showResult') ? t('showResult') : 'Hiện Kết Quả'} &rarr;
          </button>
        ) : (
          <button
            onClick={() => setHostPhase('LEADERBOARD')}
            className="bg-brand-purple text-white px-8 py-4 rounded-2xl font-black text-xl shadow-md hover:bg-purple-700 transition transform hover:scale-[1.02]"
          >
            {t("showLeaderboard")} &rarr;
          </button>
        )}
      </div>
    );

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

        {isManual && (hostPhase === 'QUESTION' || hostPhase === 'RESULT') ? questionContent : leaderboardContent}
      </div>
    );
  } else if (session.status === "FINISHED") {
    const sorted = [...participants].sort((a, b) => b.score - a.score);
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
                  {i + 1}. {session.randomNicknames ? p.randomName : p.nickname}
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
