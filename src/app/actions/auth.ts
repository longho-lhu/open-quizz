"use server";

import { db } from "@/lib/db";
import { usersTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and password are required" };

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, email.toLowerCase())
  });

  if (!user || !user.password) {
    return { error: "Invalid credentials" };
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return { error: "Invalid credentials" };

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

  if (user.role === "STUDENT") {
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

  const existing = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, email.toLowerCase())
  });

  if (existing) return { error: "Email already exists" };

  const hashedPassword = await bcrypt.hash(password, 10);
  const id = Math.random().toString(36).slice(2);

  await db.insert(usersTable).values({
    id,
    email: email.toLowerCase(),
    name,
    password: hashedPassword,
    role: role,
    createdAt: new Date(),
  });

  // Log them in immediately
  const sessionData = { id, email: email.toLowerCase(), role, name };
  const encryptedSession = await encrypt(sessionData);
  const cookieStore = await cookies();
  cookieStore.set("session", encryptedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 1 day
    path: "/",
  });

  if (role === "STUDENT") {
    redirect("/student/history");
  } else {
    redirect("/teacher/dashboard");
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}
