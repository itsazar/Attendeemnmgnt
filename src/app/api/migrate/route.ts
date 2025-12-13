import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * API route to run database migrations
 *
 * Usage:
 * POST /api/migrate
 * Headers: Authorization: Bearer <MIGRATION_SECRET>
 *
 * Set MIGRATION_SECRET in Vercel environment variables
 */
export async function POST(request: Request) {
  // Check authorization
  const authHeader = request.headers.get("authorization");
  const migrationSecret = process.env.MIGRATION_SECRET;

  if (!migrationSecret) {
    return NextResponse.json(
      { error: "MIGRATION_SECRET not configured" },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${migrationSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("Running database migrations...");

    // Run Prisma migrations
    const { stdout, stderr } = await execAsync("npx prisma migrate deploy");

    console.log("Migration output:", stdout);
    if (stderr) {
      console.warn("Migration warnings:", stderr);
    }

    return NextResponse.json({
      success: true,
      message: "Migrations completed successfully",
      output: stdout,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
