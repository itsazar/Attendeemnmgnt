/**
 * demoattendee — src/app/api/auth/login/route.ts
 *
 * Brief: Simple login route (development only). Sets an `auth-token` cookie.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Password@123";

/** POST /api/auth/login */
export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Validate credentials
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Create session token (simple approach - in production use JWT)
      const sessionToken = Buffer.from(`${username}:${Date.now()}`).toString(
        "base64",
      );
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Set cookie
      const cookieStore = await cookies();
      cookieStore.set("auth-token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expiresAt,
        path: "/",
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 },
    );
  }
}
