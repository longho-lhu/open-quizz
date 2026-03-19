"use server";

import { db } from "@/lib/db";
import { usersTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/mailer";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and password are required" };

  // Hardcoded ENV admin check
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword && email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
    const sessionData = {
      id: "admin-env",
      email: adminEmail,
      role: "ADMIN",
      name: "System Admin",
    };

    const encryptedSession = await encrypt(sessionData);
    const cookieStore = await cookies();
    cookieStore.set("session", encryptedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });
    redirect("/admin/dashboard");
  }

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, email.toLowerCase())
  });

  if (!user || !user.password) {
    return { error: "Invalid credentials" };
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return { error: "Invalid credentials" };

  if (!user.isVerified) {
    return { error: "Vui lòng kiểm tra email để xác thực tài khoản trước khi đăng nhập." };
  }

  const sessionData = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const encryptedSession = await encrypt(sessionData);

  const cookieStore = await cookies();
  cookieStore.set("session", encryptedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 1 day
    path: "/",
  });

  if (user.role === "ADMIN") {
    redirect("/admin/dashboard");
  } else if (user.role === "STUDENT") {
    redirect("/student/history");
  } else {
    redirect("/teacher/dashboard");
  }
}

export async function registerAction(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string || "STUDENT";

  if (!email || !password || !name) return { error: "All fields are required" };
  if (role === "ADMIN") return { error: "Cannot register as ADMIN" };

  const existing = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, email.toLowerCase())
  });

  if (existing) return { error: "Email already exists" };

  const hashedPassword = await bcrypt.hash(password, 10);
  const id = Math.random().toString(36).slice(2);
  const vToken = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

  await db.insert(usersTable).values({
    id,
    email: email.toLowerCase(),
    name,
    password: hashedPassword,
    role: role,
    isVerified: false,
    verificationToken: vToken,
    createdAt: new Date(),
  });

  await sendVerificationEmail(email.toLowerCase(), name, vToken);

  return { success: true, requireVerification: true };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}

export async function forgotPasswordAction(formData: FormData) {
  const email = formData.get("email") as string;
  if (!email) return { error: "Vui lòng nhập email" };

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, email.toLowerCase())
  });

  if (!user) {
    // Security best practice: Always return success for forgot pwd to avoid email enumeration
    return { success: true };
  }

  const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  await db.update(usersTable)
    .set({ resetToken: token, resetTokenExpires: expires })
    .where(eq(usersTable.id, user.id));

  await sendPasswordResetEmail(user.email, user.name || "User", token);

  return { success: true };
}

export async function resetPasswordAction(formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token || !password || !confirmPassword) return { error: "Vui lòng điền đầy đủ thông tin" };
  if (password !== confirmPassword) return { error: "Mật khẩu xác nhận không khớp" };

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.resetToken, token)
  });

  if (!user || !user.resetTokenExpires || user.resetTokenExpires.getTime() < Date.now()) {
    return { error: "Đường link khôi phục không hợp lệ hoặc đã hết hạn" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.update(usersTable)
    .set({ password: hashedPassword, resetToken: null, resetTokenExpires: null })
    .where(eq(usersTable.id, user.id));

  return { success: true };
}
