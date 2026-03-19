import { getSessionStatus } from "@/app/actions/live";
import { Link } from "@/i18n/routing";
import ExportExcelButton from "@/components/ExportExcelButton";

export default async function SessionResultsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const data = await getSessionStatus(sessionId);

  if (!data || !data.session) return <div className="p-8 text-center text-xl font-bold">Session not found</div>;

  const { session, participants } = data;
  const sorted = [...participants].sort((a,b)=>b.score - a.score);

  return (
    <div className="max-w-4xl mx-auto space-y-8 w-full pb-20">
       <Link href="/teacher/sessions" className="btn-secondary inline-block">&larr; Back to History</Link>
       
       <div className="bg-white rounded-3xl p-8 shadow-sm border-2 border-gray-100">
         <div className="flex justify-between items-start">
           <div>
             <h1 className="text-4xl font-black text-brand-dark mb-2">{session.name || session.quiz.title}</h1>
             <p className="text-xl text-gray-500 font-bold mb-6">Game Code: <span className="text-brand-purple">#{session.code}</span></p>
           </div>
           <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
             session.status === 'FINISHED' ? 'bg-gray-200 text-gray-600' :
             session.status === 'IN_PROGRESS' ? 'bg-brand-green/20 text-brand-green' : 'bg-brand-yellow/20 text-brand-yellow'
           }`}>
             {session.status}
           </span>
         </div>

         <div className="grid grid-cols-2 gap-4 mb-8">
           <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-100">
             <div className="text-sm font-bold text-blue-500 mb-1">Total Players</div>
             <div className="text-4xl font-black text-blue-700">{participants.length}</div>
           </div>
           <div className="bg-purple-50 p-6 rounded-2xl border-2 border-purple-100">
             <div className="text-sm font-bold text-purple-500 mb-1">Total Questions</div>
             <div className="text-4xl font-black text-purple-700">{session.quiz.questions.length}</div>
           </div>
         </div>

         <div className="flex justify-between items-center mb-4">
           <h2 className="text-2xl font-bold">Detailed Leaderboard</h2>
           <ExportExcelButton session={session} participants={sorted} />
         </div>
         <div className="space-y-4">
           {sorted.map((p, i) => {
             const progress = p.answers?.length || 0;
             const isComplete = progress === session.quiz.questions.length;
             const correctCount = p.answers?.filter((a: any) => a.isCorrect).length || 0;
             const incorrectCount = progress - correctCount;

             return (
               <div key={p.id} className="flex justify-between items-center bg-gray-50 p-6 rounded-2xl border-2 border-gray-200 shadow-sm hover:scale-[1.01] transition-transform">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-black text-gray-500 border-2 border-gray-200 shadow-sm">{i+1}</div>
                   <div>
                     <span className="font-bold text-2xl">{p.nickname}</span>
                     <div className="text-sm font-bold text-gray-500 mt-1 flex items-center gap-2">
                       <span>{progress} / {session.quiz.questions.length} answered</span>
                       {isComplete && <span className="text-brand-green">✓ Finished</span>}
                     </div>
                     <div className="text-sm font-bold mt-2 flex gap-3">
                       <span className="text-brand-green bg-brand-green/10 px-2.5 py-1 rounded-lg border border-brand-green/20">{correctCount} Correct</span>
                       <span className="text-red-500 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">{incorrectCount} Incorrect</span>
                     </div>
                   </div>
                 </div>
                 <div className="font-black text-3xl text-brand-purple bg-white px-4 py-2 rounded-xl border-2 border-gray-100 shadow-sm">{p.score} pts</div>
               </div>
             );
           })}
           {sorted.length === 0 && <p className="text-gray-500 italic p-4 text-center">No participants joined this session.</p>}
         </div>
       </div>
    </div>
  );
}
