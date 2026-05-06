import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/hello:
 *   get:
 *     summary: Returns a hello message
 *     description: A sample API endpoint to demonstrate Swagger documentation.
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Hello World
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "Hello World" });
}
