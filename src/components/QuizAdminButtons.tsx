"use client";
import { deleteQuizAction, renameQuizAction, shareQuizAction } from "@/app/actions/quiz";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function QuizAdminButtons({ quizId, currentTitle, isOwner = true }: { quizId: string, currentTitle: string, isOwner?: boolean }) {
   const t = useTranslations("Dashboard");
   const handleDelete = async () => {
      if (confirm(t("confirmDelete"))) {
          await deleteQuizAction(quizId);
      }
   }
   
   const handleRename = async () => {
      const newTitle = prompt("Enter new title:", currentTitle);
      if (newTitle && newTitle.trim() !== currentTitle) {
          await renameQuizAction(quizId, newTitle.trim());
      }
   }

   const handleShare = async () => { 
      const email = prompt("Enter the email to share this quiz with:");
      if (email && email.trim() !== "") {
          try {
             const res = await shareQuizAction(quizId, email.trim());
             alert("Quiz shared successfully!");
          } catch(e:any) {
             alert(e.message || "Failed to share quiz.");
          }
      }
   }

   return (
       <div className="flex gap-2">
           {isOwner && <button onClick={handleShare} className="text-sm font-bold text-gray-400 hover:text-blue-500 transition-colors">{t("share", { fallback: "Share" })}</button>}
           {isOwner && <Link href={`/teacher/quiz/${quizId}/edit`} className="text-sm font-bold text-gray-400 hover:text-brand-purple transition-colors">{t("edit")}</Link>}
           {isOwner && <button onClick={handleRename} className="text-sm font-bold text-gray-400 hover:text-brand-purple transition-colors">{t("rename", { fallback: "Rename" })}</button>}
           {isOwner && <button onClick={handleDelete} className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors">{t("delete")}</button>}
       </div>
   );
}
