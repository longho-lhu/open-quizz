"use client";
import { deleteQuizAction, renameQuizAction } from "@/app/actions/quiz";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function QuizAdminButtons({ quizId, currentTitle }: { quizId: string, currentTitle: string }) {
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

   return (
       <div className="flex gap-2">
           <Link href={`/teacher/quiz/${quizId}/edit`} className="text-sm font-bold text-gray-400 hover:text-brand-purple transition-colors">{t("edit")}</Link>
           <button onClick={handleRename} className="text-sm font-bold text-gray-400 hover:text-brand-purple transition-colors">Rename</button>
           <button onClick={handleDelete} className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors">{t("delete")}</button>
       </div>
   );
}
