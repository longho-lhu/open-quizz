import { db } from "@/lib/db";
import { usersTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { Link } from "@/i18n/routing";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  if (!token) {
    return <VerifyMessage success={false} message="Mã xác thực không hợp lệ hoặc không tồn tại." />;
  }

  const user = await db.query.usersTable.findFirst({
    where: and(eq(usersTable.verificationToken, token), eq(usersTable.isVerified, false))
  });

  if (!user) {
    return <VerifyMessage success={false} message="Mã xác thực không hợp lệ, hoặc tài khoản đã được xác thực trước đó." />;
  }

  // Update user
  await db.update(usersTable)
    .set({ isVerified: true, verificationToken: null })
    .where(eq(usersTable.id, user.id));

  return <VerifyMessage success={true} message="Tài khoản của bạn đã được xác thực thành công! Bạn hiện có thể đăng nhập vào hệ thống." />;
}

function VerifyMessage({ success, message }: { success: boolean, message: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl border-4 border-gray-100 text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${success ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
          {success ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <h2 className={`text-2xl font-black mb-4 ${success ? 'text-brand-dark' : 'text-red-600'}`}>
          {success ? 'Xác thực thành công' : 'Lỗi xác thực'}
        </h2>
        <p className="text-gray-600 mb-8 font-medium leading-relaxed">
          {message}
        </p>
        <Link href="/login" className={`font-bold py-3 px-4 rounded-xl block w-full transition border-b-4 active:border-b-0 active:translate-y-1 ${success ? 'bg-brand-purple hover:bg-brand-purple/90 text-white border-purple-800' : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-400'}`}>
          Đến trang Đăng nhập
        </Link>
      </div>
    </div>
  );
}
