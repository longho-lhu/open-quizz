"use client";
import { deleteSessionAction, renameSessionAction, resetSessionAction, forceEndSessionAction } from "@/app/actions/live";

export default function SessionAdminButtons({ sessionId, currentName, status }: { sessionId: string, currentName: string, status: string }) {
   const handleDelete = async () => {
      if (confirm("Are you sure you want to delete this session and all its results?")) {
          await deleteSessionAction(sessionId);
      }
   }
   
   const handleRename = async () => {
      const newName = prompt("Enter a custom name for this session (e.g. Class 10A2):", currentName);
      if (newName !== null) { // allow empty strings to clear the name
          await renameSessionAction(sessionId, newName.trim());
      }
   }

   const handleReset = async () => {
      if (confirm("Resetting this session will delete all participant results and move it back to the WAIT room. Proceed?")) {
          await resetSessionAction(sessionId);
      }
   }

   const handleEnd = async () => {
      if (confirm("Are you sure you want to end this session early?")) {
          await forceEndSessionAction(sessionId);
      }
   }

   return (
       <div className="flex gap-3">
           {status !== "FINISHED" && (
              <button onClick={handleEnd} className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors">End</button>
           )}
           <button onClick={handleRename} className="text-xs font-bold text-gray-500 hover:text-brand-purple transition-colors">Rename</button>
           <button onClick={handleReset} className="text-xs font-bold text-gray-500 hover:text-brand-yellow transition-colors">Reset</button>
           <button onClick={handleDelete} className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors">Delete</button>
       </div>
   );
}
