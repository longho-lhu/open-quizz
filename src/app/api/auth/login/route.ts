import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { usersTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login and get token
 *     description: Authenticates a user and returns a JWT Bearer token along with user info.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     name:
 *                       type: string
 *       400:
 *         description: Missing fields
 *       401:
 *         description: Invalid credentials or unverified email
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email || body.user;
    const password = body.password || body.pass;

    if (!email || !password) {
      return NextResponse.json({ error: "Email/user and password/pass are required" }, { status: 400 });
    }

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

      const token = await encrypt(sessionData);

      const response = NextResponse.json({ success: true, token, user: sessionData });
      
      // Also set cookie for web clients
      response.cookies.set("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      });

      return response;
    }

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, email.toLowerCase())
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!user.isVerified) {
      return NextResponse.json({ error: "Vui lòng kiểm tra email để xác thực tài khoản trước khi đăng nhập." }, { status: 401 });
    }

    const sessionData = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = await encrypt(sessionData);

    const response = NextResponse.json({ success: true, token, user: sessionData });
    
    // Also set cookie for web clients
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
