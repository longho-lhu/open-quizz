"use server";

import { db } from "@/lib/db";
import { usersTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import * as bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

export async function updateProfileAction(name: string, avatar: string | null) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    let finalAvatarUrl = avatar;

    if (avatar && avatar.startsWith("data:image/")) {
      const matches = avatar.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
         const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
         const buffer = Buffer.from(matches[2], "base64");
         const filename = `avatar-${session.id}-${Date.now()}.${ext}`;
         
         const uploadsDir = path.join(process.cwd(), "public", "uploads");
         if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
         }
         
         const filePath = path.join(uploadsDir, filename);
         fs.writeFileSync(filePath, buffer);
         
         finalAvatarUrl = `/uploads/${filename}`;
      }
    }

    await db.update(usersTable)
      .set({ name, avatar: finalAvatarUrl })
      .where(eq(usersTable.id, session.id));
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "errorGeneric" };
  }
}

export async function updatePasswordAction(oldPassword: string, newPassword: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, session.id),
    });

    if (!user || !user.password) return { success: false, error: "User not found or no password set." };

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return { success: false, error: "errorOldPassword" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(usersTable)
      .set({ password: hashedPassword })
      .where(eq(usersTable.id, session.userId));

    return { success: true };
  } catch (error) {
    console.error("Failed to update password", error);
    return { success: false, error: "Database error" };
  }
}
