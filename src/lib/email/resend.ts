import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EventMatch {
  viewName: string;
  events: {
    name: string;
    venue?: { name: string } | null;
    eventDate?: Date | null;
    onsaleWindows?: { windowType: string; startDate: Date; endDate: Date | null }[];
  }[];
}

export async function sendNewEventEmail(
  to: string,
  matches: EventMatch[]
) {
  const totalEvents = matches.reduce((sum, m) => sum + m.events.length, 0);
  const subject = `TicketScout: ${totalEvents} new event${totalEvents > 1 ? "s" : ""} match your saved views`;

  const sections = matches
    .map((m) => {
      const eventList = m.events
        .map((e) => {
          const venue = e.venue?.name ? ` — ${e.venue.name}` : "";
          const date = e.eventDate
            ? new Date(e.eventDate).toLocaleDateString("en-CA", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "";

          // Build presale info
          const presaleHtml = formatPresaleHtml(e.onsaleWindows ?? []);

          return `
            <div style="margin-bottom:12px;padding:10px 12px;background:#1a1a1a;border-radius:8px;border:1px solid #333;">
              <div style="font-size:14px;font-weight:600;margin-bottom:4px;">${e.name}</div>
              <div style="font-size:12px;color:#aaa;">${date}${venue}</div>
              ${presaleHtml}
            </div>
          `;
        })
        .join("");
      return `
        <div style="margin-bottom:20px;">
          <h3 style="margin:0 0 10px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">View: ${m.viewName}</h3>
          ${eventList}
        </div>
      `;
    })
    .join("");

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#111;color:#eee;">
      <h2 style="margin:0 0 20px;font-size:18px;color:#fff;">New Events Matching Your Views</h2>
      ${sections}
      <hr style="border:none;border-top:1px solid #333;margin:24px 0;" />
      <p style="font-size:11px;color:#666;">You're receiving this because you have notifications enabled for saved views on TicketScout.</p>
    </div>
  `;

  await resend.emails.send({
    from: "TicketScout <onboarding@resend.dev>",
    to,
    subject,
    html,
  });
}

function formatPresaleHtml(
  windows: { windowType: string; startDate: Date; endDate: Date | null }[]
): string {
  if (!windows || windows.length === 0) return "";

  const now = new Date();
  const upcoming = windows
    .filter((w) => w.startDate > now)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  if (upcoming.length === 0) {
    const past = windows.filter((w) => w.startDate <= now);
    if (past.length > 0) {
      return `<div style="margin-top:6px;font-size:11px;color:#4ade80;">Already on sale</div>`;
    }
    return "";
  }

  const parts: string[] = [];
  const presales = upcoming.filter((w) => w.windowType === "presale");
  const general = upcoming.find((w) => w.windowType === "general");

  if (presales.length > 0) {
    const fmt = formatDate(presales[0].startDate);
    parts.push(
      `<span style="color:#60a5fa;">Presale: ${fmt}</span>`
    );
  }

  if (general) {
    const fmt = formatDate(general.startDate);
    parts.push(
      `<span style="color:#4ade80;">General: ${fmt}</span>`
    );
  }

  return `<div style="margin-top:6px;font-size:11px;">${parts.join(" &nbsp;|&nbsp; ")}</div>`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
