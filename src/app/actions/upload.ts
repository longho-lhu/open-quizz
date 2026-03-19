"use server";

import { join } from "path";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { getSession } from "@/lib/auth";

export async function uploadImageAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { error: "No file uploaded" };
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadsDir = join(process.cwd(), "public", "uploads", "questions");
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  // Create a unique filename
  const extension = file.name.substring(file.name.lastIndexOf("."));
  const randomName = Math.random().toString(36).substring(2, 15) + Date.now().toString(36) + extension;
  
  const filePath = join(uploadsDir, randomName);
  await writeFile(filePath, buffer);

  // Return the public URL path
  return { success: true, url: `/uploads/questions/${randomName}` };
}
