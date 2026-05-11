"use client";

import { useState, useEffect } from "react";

export default function PingDisplay() {
  const [ping, setPing] = useState<number | null>(null);
  const [showPing, setShowPing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // Load setting from localStorage
    const saved = localStorage.getItem("openquizz_show_ping");
    if (saved === "true") {
      setShowPing(true);
    }
  }, []);

  const togglePing = () => {
    const newVal = !showPing;
    setShowPing(newVal);
    localStorage.setItem("openquizz_show_ping", String(newVal));
  };

  useEffect(() => {
    if (!showPing) {
      setPing(null);
      return;
    }

    const measurePing = async () => {
      const start = performance.now();
      try {
        await fetch("/api/ping", { cache: "no-store" });
        const end = performance.now();
        setPing(Math.round(end - start));
      } catch (e) {
        setPing(-1); // Error state
      }
    };

    measurePing();
    const interval = setInterval(measurePing, 3000);

    return () => clearInterval(interval);
  }, [showPing]);

  let pingColor = "text-green-500";
  if (ping && ping > 150) pingColor = "text-yellow-500";
  if (ping && ping > 300) pingColor = "text-red-500";
  if (ping === -1) pingColor = "text-red-500";

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-end flex-col gap-2">
      {isSettingsOpen && (
        <div className="bg-white p-4 rounded-2xl shadow-xl border-2 border-gray-100 animate-bounce-in w-48 text-left">
          <h4 className="font-bold text-gray-700 mb-3 text-sm border-b pb-2">Cài đặt User</h4>
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm font-semibold text-gray-600 group-hover:text-brand-purple transition">Hiển thị Ping</span>
            <input
              type="checkbox"
              checked={showPing}
              onChange={togglePing}
              className="w-5 h-5 accent-brand-purple cursor-pointer"
            />
          </label>
        </div>
      )}

      <div className="flex items-center gap-2">
        {showPing && (
          <div className={`bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md border-2 border-gray-100 flex items-center gap-1.5 font-bold text-sm ${pingColor}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            {ping === -1 ? "Lỗi" : ping === null ? "..." : `${ping}ms`}
          </div>
        )}
        
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md border-2 border-gray-100 text-gray-500 hover:text-brand-purple hover:scale-105 transition active:scale-95"
          title="Cài đặt User"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </button>
      </div>
    </div>
  );
}
