"use client";

import { useTransition } from "react";
import { updateUserPlanAction } from "@/app/actions/admin";

export default function PlanSelect({ userId, currentPlan }: { userId: string, currentPlan: string }) {
  const [isPending, startTransition] = useTransition();

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPlan = e.target.value;
    startTransition(async () => {
      const res = await updateUserPlanAction(userId, newPlan);
      if (res?.error) {
        alert(res.error);
      }
    });
  };

  return (
    <select 
      value={currentPlan} 
      onChange={handlePlanChange}
      disabled={isPending}
      className={`px-2 py-1.5 rounded-lg text-xs font-bold border-2 outline-none transition cursor-pointer 
        ${currentPlan === 'PRO_MAX' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
          currentPlan === 'PRO' ? 'bg-blue-100 text-blue-700 border-blue-200' :
          'bg-green-100 text-green-700 border-green-200'
        } ${isPending ? 'opacity-50' : ''}`}
    >
      <option value="ECO">ECO</option>
      <option value="PRO">PRO</option>
      <option value="PRO_MAX">PRO MAX</option>
    </select>
  );
}
