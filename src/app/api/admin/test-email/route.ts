import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendNewEventEmail } from "@/lib/email/resend";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const to = body.to ?? session.user.email;

  try {
    await sendNewEventEmail(to, [
      {
        viewName: "Arena Shows 50+",
        events: [
          {
            name: "Bruno Mars - 6 Night Run",
            venue: { name: "Scotiabank Arena" },
            eventDate: new Date("2026-08-15"),
            onsaleWindows: [
              { windowType: "presale", startDate: new Date("2026-04-01T10:00:00"), endDate: null },
              { windowType: "general", startDate: new Date("2026-04-04T10:00:00"), endDate: null },
            ],
          },
          {
            name: "Zach Bryan - The Great American Bar Show",
            venue: { name: "Rogers Stadium" },
            eventDate: new Date("2026-07-22"),
            onsaleWindows: [
              { windowType: "general", startDate: new Date("2026-03-20T10:00:00"), endDate: null },
            ],
          },
        ],
      },
    ]);

    return NextResponse.json({ sent: true, to });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
