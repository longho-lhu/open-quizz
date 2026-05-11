"use client";

import { useState } from "react";
import { joinQuizWithNicknameAction } from "@/app/actions/play";

export default function TestFakeUsersPage() {
  const [code, setCode] = useState("");
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!code) {
      setError("Vui lòng nhập mã PIN.");
      return;
    }
    
    setLoading(true);
    setProgress(0);
    setError(null);
    
    let successCount = 0;
    const batchSize = 10;
    
    for (let i = 0; i < count; i += batchSize) {
      const currentBatch = Math.min(batchSize, count - i);
      const promises = [];
      
      for (let j = 0; j < currentBatch; j++) {
        const fakeDeviceId = `fake_device_${Date.now()}_${i + j}`;
        promises.push(joinQuizWithNicknameAction(code, "", fakeDeviceId));
      }
      
      const results = await Promise.all(promises);
      
      const hasError = results.find(r => r.error);
      if (hasError) {
        setError(hasError.error || "Có lỗi xảy ra khi tạo user");
        break; // Stop if room is full or error occurs
      }
      
      successCount += currentBatch;
      setProgress(successCount);
      
      // Delay slightly between batches to avoid overloading DB
      await new Promise(r => setTimeout(r, 200));
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border-4 border-gray-100 max-w-md w-full">
        <h1 className="text-3xl font-black text-brand-dark mb-6 text-center">Load Test<br/><span className="text-xl text-gray-500 font-bold">Tạo User Giả Lập</span></h1>
        
        {error && <div className="mb-4 p-3 bg-red-100 text-red-600 font-bold rounded-xl border-2 border-red-200">{error}</div>}
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Mã PIN (Code)</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="VD: 123456"
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-brand-purple outline-none font-bold text-gray-800 text-xl text-center uppercase"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-bold mb-2">Số lượng user</label>
            <input
              type="number"
              value={count}
              onChange={e => setCount(Number(e.target.value))}
              min="1"
              max="1000"
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-brand-purple outline-none font-bold text-gray-800 text-xl text-center"
            />
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-brand-purple hover:bg-purple-700 text-white font-black rounded-xl text-xl py-4 transition-all hover:scale-[1.02] shadow-md border-b-4 border-purple-900 active:border-b-0 active:translate-y-1 mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="spinner w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full"></span>
                Đang tạo... ({progress}/{count})
              </>
            ) : (
              "Bắt đầu tạo user"
            )}
          </button>
        </div>
        
        {progress > 0 && !loading && !error && (
          <div className="mt-6 p-4 bg-brand-green/10 text-brand-green font-bold rounded-xl border-2 border-brand-green/20 text-center">
            Đã tạo thành công {progress} user!
          </div>
        )}
      </div>
    </div>
  );
}
