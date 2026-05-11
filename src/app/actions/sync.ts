"use server";

import { db } from "@/lib/db";
import { quizzesTable, questionsTable, optionsTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function syncDataFromVPS() {
  const session = await getSession();
  if (!session || !session.id) {
    return { error: "Không tìm thấy phiên đăng nhập" };
  }

  // Cần vpsToken lưu trong session lúc login
  const vpsToken = session.vpsToken;
  if (!vpsToken) {
    return { error: "Vui lòng đăng nhập lại khi có mạng để lấy quyền đồng bộ" };
  }

  const vpsUrl = process.env.NEXT_PUBLIC_VPS_URL || 'https://open-quizz.vercel.app'; // Update this default if needed

  try {
    const res = await fetch(`${vpsUrl}/api/sync/export`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${vpsToken}`
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!res.ok) {
      return { error: "Không thể kết nối đến máy chủ online" };
    }

    const data = await res.json();
    if (!data.success) {
      return { error: data.error || "Lỗi đồng bộ dữ liệu" };
    }

    const { quizzes, questions, options } = data;

    // Tiến hành nạp dữ liệu vào local DB
    // Vì Drizzle không có upsert dễ dàng cho mọi schema, ta xoá dữ liệu cũ của user này và thêm mới
    
    // 1. Xoá quizzes cũ của user
    await db.delete(quizzesTable).where(eq(quizzesTable.creatorId, session.id as string));
    
    // 2. Insert lại (cascade sẽ tự động xoá questions, options cũ do có onDelete: "cascade" trong schema, 
    // nhưng xoá trực tiếp vẫn an toàn hơn nếu đã có dữ liệu rác. Ở đây ta xoá quizzes thì cascade sẽ lo phần còn lại).
    
    if (quizzes.length > 0) {
      // Drizzle insert có thể gặp lỗi nếu data rỗng
      await db.insert(quizzesTable).values(
        quizzes.map((q: any) => ({
          ...q,
          createdAt: new Date(q.createdAt),
        }))
      );
    }

    if (questions.length > 0) {
      await db.insert(questionsTable).values(
        questions.map((q: any) => ({
          ...q,
          createdAt: new Date(q.createdAt),
        }))
      );
    }

    if (options.length > 0) {
      await db.insert(optionsTable).values(options);
    }

    return { success: true, message: `Đồng bộ thành công ${quizzes.length} bộ câu hỏi.` };

  } catch (error) {
    console.error("Lỗi khi đồng bộ:", error);
    return { error: "Có lỗi xảy ra khi đồng bộ: " + (error as Error).message };
  }
}
