import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { voteOnCode } from "@/db/queries/presale-codes";
import { requirePro, UpgradeRequiredError } from "@/lib/subscription";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  try {
    await requirePro(session.user.id, role, "presale code voting");
  } catch (err) {
    if (err instanceof UpgradeRequiredError) {
      return NextResponse.json(
        { error: err.message, code: "upgrade_required" },
        { status: 403 }
      );
    }
    throw err;
  }

  const { id } = await params;
  const codeId = Number(id);
  if (!codeId || isNaN(codeId)) {
    return NextResponse.json({ error: "Invalid code ID" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const { vote } = body;

  if (vote !== "working" && vote !== "not_working") {
    return NextResponse.json(
      { error: "vote must be 'working' or 'not_working'" },
      { status: 400 }
    );
  }

  try {
    const result = await voteOnCode({
      codeId,
      userId: session.user.id,
      vote,
    });

    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
