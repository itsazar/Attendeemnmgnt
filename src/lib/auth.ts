import { cookies } from "next/headers";

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

export async function requireAuth() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    throw new Error("Unauthorized");
  }
}

