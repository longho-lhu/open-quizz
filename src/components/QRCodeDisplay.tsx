"use client";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { createPortal } from "react-dom";

export default function QRCodeDisplay({ code }: { code: string }) {
  const [url, setUrl] = useState("");
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [mounted, setMounted] = useState(false);
  const locale = useLocale();

  useEffect(() => {
    setMounted(true);
    setUrl(`${window.location.origin}/${locale}/join?code=${code}`);
  }, [code, locale]);

  if (!url) return <div className="w-[200px] h-[200px] bg-gray-100 rounded-3xl animate-pulse mb-8 border-4 border-transparent"></div>;

  return (
    <>
      <div 
        onClick={() => setIsEnlarged(true)}
        className="bg-white p-6 rounded-3xl shadow-xl border-4 border-brand-purple mb-8 inline-block cursor-zoom-in hover:scale-105 transition-transform"
        title="Click to enlarge"
      >
        <QRCodeSVG value={url} size={200} bgColor={"#ffffff"} fgColor={"#000000"} level={"H"} />
        <p className="text-center font-bold text-gray-600 mt-4 text-sm tracking-widest uppercase">SCAN TO JOIN</p>
      </div>

      {isEnlarged && mounted && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setIsEnlarged(false)}
        >
          <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl flex flex-col items-center border-8 border-brand-purple animate-in zoom-in-90 duration-300">
            <QRCodeSVG 
              value={url} 
              size={500} 
              bgColor={"#ffffff"} 
              fgColor={"#000000"} 
              level={"H"} 
              style={{ width: "100%", height: "auto", maxWidth: "50vh", maxHeight: "50vh" }}
            />
            <p className="text-center font-black text-brand-dark mt-8 text-3xl md:text-5xl tracking-widest uppercase drop-shadow-sm">SCAN TO JOIN</p>
            <p className="text-gray-400 font-bold mt-4 text-lg bg-gray-100 px-4 py-2 rounded-full">Click anywhere to close</p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
