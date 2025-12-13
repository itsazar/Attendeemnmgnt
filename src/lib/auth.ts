/**
 * demoattendee — src/lib/auth.ts
 *
 * Brief: Authentication helpers used by middleware and API routes.
 */
import { cookies } from "next/headers";

/**
 * Check whether the current request has an authentication cookie set.
 * @returns {Promise<boolean>} true when an auth token exists
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token");

  if (!token) {
    return false;
  }

  // In a production app, you'd verify the token here
  // For simplicity, we just check if it exists
  return true;
}

/**
 * Ensure the current request is authenticated; throws on failure.
 * @throws {Error} when authentication is missing
 */
export async function requireAuth() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    throw new Error("Unauthorized");
  }
}
