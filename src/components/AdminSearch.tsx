"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useState } from "react";

export default function AdminSearch({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [inputValue, setInputValue] = useState(searchParams.get("q")?.toString() || "");

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (inputValue.trim()) {
      params.set("q", inputValue.trim());
    } else {
      params.delete("q");
      setInputValue("");
    }
    
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <form onSubmit={handleSearch} className="relative max-w-xs w-full">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
        </svg>
      </div>
      <input 
        type="search" 
        className="block w-full p-2.5 pl-10 text-sm text-gray-900 border-2 border-gray-100 rounded-xl focus:ring-brand-purple focus:border-brand-purple bg-gray-50/50 outline-none transition-all shadow-inner" 
        placeholder={placeholder} 
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      {isPending && (
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <div className="animate-spin w-4 h-4 border-2 border-brand-purple border-t-transparent rounded-full" />
        </div>
      )}
    </form>
  );
}
