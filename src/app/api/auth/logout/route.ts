import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Clears the session cookie to logout the user.
 *     responses:
 *       200:
 *         description: Successfully logged out
 */
export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete("session");
  return response;
}
