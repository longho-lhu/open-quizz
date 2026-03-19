"use client";

import { useTransition } from "react";
import { approveTeacherAction, rejectTeacherAction } from "@/app/actions/admin";

export default function ApprovalButtons({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-2 justify-end">
      <button 
        disabled={isPending}
        onClick={() => startTransition(async () => {
          const res = await approveTeacherAction(id);
          if (res?.error) alert(res.error);
        })}
        className="bg-green-100 text-green-700 hover:bg-green-500 hover:text-white px-3 py-1.5 rounded-lg font-bold text-sm transition disabled:opacity-50"
      >
        ✅ Duyệt
      </button>
      <button 
        disabled={isPending}
        onClick={() => startTransition(async () => {
          if (confirm("Bạn có chắc muốn từ chối yêu cầu này? Tài khoản vẫn là Giáo viên nhưng gói sẽ chuyển về ECO.")) {
            const res = await rejectTeacherAction(id);
            if (res?.error) alert(res.error);
          }
        })}
        className="bg-red-100 text-red-700 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg font-bold text-sm transition disabled:opacity-50"
      >
        ❌ Từ chối
      </button>
    </div>
  );
}
