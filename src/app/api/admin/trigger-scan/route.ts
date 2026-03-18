import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runEventScan } from "@/services/ticketmaster/scanner";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const fullSync = body.fullSync === true;

  const result = await runEventScan("manual", { fullSync });
  return NextResponse.json(result);
}
