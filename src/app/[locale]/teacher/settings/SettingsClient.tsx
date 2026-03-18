"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { updateProfileAction, updatePasswordAction } from "@/app/actions/user";
import { updateApiKeyAction } from "@/app/actions/settings";

export default function SettingsClient({ initialName, initialAvatar, initialApiKey, dbUser }: { initialName: string, initialAvatar: string, initialApiKey: string, dbUser?: any }) {
  const t = useTranslations("Settings");
  
  const [name, setName] = useState(initialName || "");
  const [avatar, setAvatar] = useState(initialAvatar || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  const AVATARS = [
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Bella",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Charlie",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Max",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Oliver",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Lucy",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Chloe",
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileErr(""); setProfileMsg("");
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { 
         setProfileErr("Image must be under 10MB.");
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e: any) => {
    e.preventDefault();
    setProfileMsg(""); setProfileErr("");
    const res = await updateProfileAction(name, avatar);
    if (res.success) {
      setProfileMsg(t("updatedProfile"));
      window.location.reload(); // Refresh to update main layout avatar
    } else {
      setProfileErr(t("errorGeneric"));
    }
  };

  const handlePasswordSubmit = async (e: any) => {
    e.preventDefault();
    setPwMsg(""); setPwErr("");
    
    if (newPassword !== confirmPassword) {
      setPwErr(t("errorMismatch"));
      return;
    }

    const res = await updatePasswordAction(oldPassword, newPassword);
    if (res.success) {
      setPwMsg(t("updatedPassword"));
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      if (res.error === "errorOldPassword") {
        setPwErr(t("errorOldPassword"));
      } else {
        setPwErr(t("errorGeneric"));
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Settings */}
      <div className="bg-white justify-between rounded-3xl p-8 shadow-sm border-2 border-gray-100 flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2">
            <span className="text-brand-purple">👤</span> {t("profileSettings")}
          </h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t("fullName")}</label>
              <input 
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-brand-purple focus:ring-0 outline-none font-bold" 
              />
            </div>
            
            <div>
               <label className="block text-sm font-bold text-gray-700 mb-2">{t("updateAvatar")}</label>
               
               <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileChange} 
               />
               <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary w-full py-3 mb-4 rounded-xl border-dashed border-2 flex items-center justify-center gap-2"
               >
                  {t('uploadDevice')}
               </button>

               <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest text-center">{t('selectDefault')}</p>
               <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 gap-4 mt-2">
                 {AVATARS.map((url) => (
                   <button 
                     type="button" 
                     key={url} 
                     onClick={() => setAvatar(url)}
                     className={`rounded-full overflow-hidden border-4 transition-all hover:scale-105 ${avatar === url ? 'border-brand-purple shadow-md scale-105 bg-brand-light' : 'border-transparent bg-gray-50'}`}
                   >
                     <img src={url} alt="Avatar option" className="w-full h-auto drop-shadow-sm" />
                   </button>
                 ))}
               </div>
            </div>

            {profileMsg && <p className="text-brand-green font-bold text-sm bg-brand-green/10 p-3 rounded-lg">{profileMsg}</p>}
            {profileErr && <p className="text-red-500 font-bold text-sm bg-red-50 p-3 rounded-lg">{profileErr}</p>}

            <button type="submit" className="btn-success w-full py-3">{t("saveChanges")}</button>
          </form>
        </div>

        {/* Current Avatar Preview */}
        <div className="md:w-64 flex flex-col items-center justify-center bg-gray-50 rounded-3xl border-2 border-gray-200 p-8 h-full">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Preview</h3>
            {avatar ? (
              <img src={avatar} alt="Current" className="w-40 h-40 object-cover rounded-full shadow-lg border-4 border-white bg-brand-light" />
            ) : (
              <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-brand-purple to-pink-500 flex items-center justify-center text-5xl text-white font-black shadow-lg border-4 border-white">
                {name.charAt(0) || "T"}
              </div>
            )}
            <p className="mt-4 font-black text-gray-800 text-xl text-center">{name}</p>
            <p className="text-gray-500 font-medium text-sm text-center">{dbUser?.email}</p>
        </div>
      </div>

      {/* Password Settings */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border-2 border-gray-100 max-w-2xl">
        <h2 className="text-2xl font-black text-brand-dark mb-6 flex items-center gap-2">
          <span className="text-brand-purple">🔒</span> {t("security")}
        </h2>
        
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{t("oldPassword")}</label>
            <input 
              type="password"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              required
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-brand-purple focus:ring-0 outline-none font-bold tracking-widest" 
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t("newPassword")}</label>
              <input 
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-brand-purple focus:ring-0 outline-none font-bold tracking-widest" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t("confirmPassword")}</label>
              <input 
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-brand-purple focus:ring-0 outline-none font-bold tracking-widest" 
              />
            </div>
          </div>
          
          {pwMsg && <p className="text-brand-green font-bold text-sm bg-brand-green/10 p-3 rounded-lg">{pwMsg}</p>}
          {pwErr && <p className="text-red-500 font-bold text-sm bg-red-50 p-3 rounded-lg">{pwErr}</p>}

          <button type="submit" className="btn-secondary w-full py-3 mt-4 text-brand-purple border-brand-purple hover:bg-brand-light">{t("updatePassword")}</button>
        </form>
      </div>

      {/* AI Settings */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border-2 border-gray-100 max-w-2xl">
        <h2 className="text-2xl font-black text-brand-dark mb-4 flex items-center gap-2">
          <span className="text-brand-purple">🤖</span> AI Configuration
        </h2>
        <p className="text-gray-500 mb-6 font-medium">Enter your personal Google Gemini API Key. This key is used exclusively for generating questions and is securely stored in your account.</p>
        
        <form action={async (formData) => {
          await updateApiKeyAction(formData);
          window.location.reload();
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Gemini API Key</label>
            <input 
              name="apiKey" 
              type="password" 
              placeholder="AIza..." 
              defaultValue={initialApiKey} 
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-brand-purple focus:ring-0 outline-none tracking-widest font-bold" 
            />
          </div>
          <button type="submit" className="btn-primary w-full sm:w-auto px-8 py-3">Save API Key</button>
        </form>
      </div>
    </div>
  );
}
