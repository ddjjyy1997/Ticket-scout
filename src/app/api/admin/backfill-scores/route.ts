import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { backfillEventScores } from "@/lib/scoring/auto-score";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scored = await backfillEventScores();
  return NextResponse.json({ scored });
}
