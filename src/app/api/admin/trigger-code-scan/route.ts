import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runCodeScan } from "@/services/code-scanner";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const mode = body.force ? "force" : "morning";

  const result = await runCodeScan(mode);
  return NextResponse.json(result);
}
