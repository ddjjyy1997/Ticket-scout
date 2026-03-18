import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ticketscout.ca";

interface PresaleReminderData {
  eventName: string;
  eventSlug: string;
  eventDate: Date | null;
  venueName: string | null;
  windowName: string | null;
  windowType: string;
  startDate: Date;
  signupUrl: string | null;
  accessCode: string | null;
}

export async function sendPresaleReminderEmail(
  to: string,
  data: PresaleReminderData
) {
  const windowLabel = data.windowName ?? data.windowType;
  const startTime = data.startDate.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const eventDateStr = data.eventDate
    ? data.eventDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const codeBlock = data.accessCode
    ? `
      <div style="margin:16px 0;padding:12px 16px;background:#ecfdf5;border:2px solid #6ee7b7;border-radius:8px;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;color:#047857;text-transform:uppercase;letter-spacing:0.5px;">Presale Code</p>
        <p style="margin:0;font-size:20px;font-weight:700;color:#065f46;letter-spacing:2px;">${data.accessCode}</p>
      </div>
    `
    : "";

  const signupBlock = data.signupUrl
    ? `
      <a href="${data.signupUrl}" style="display:inline-block;margin:8px 0;padding:8px 16px;background:#f0fdf4;color:#047857;border:1px solid #bbf7d0;border-radius:6px;font-size:13px;font-weight:500;text-decoration:none;">
        Sign Up for Access &rarr;
      </a>
    `
    : "";

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#ffffff;color:#1a1a1a;">
      <div style="text-align:center;margin-bottom:24px;">
        <p style="margin:0;font-size:11px;color:#047857;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Presale Reminder</p>
      </div>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:16px;">
        <h2 style="margin:0 0 8px;font-size:18px;color:#0f172a;">${data.eventName}</h2>
        ${eventDateStr ? `<p style="margin:0 0 4px;font-size:13px;color:#64748b;">${eventDateStr}</p>` : ""}
        ${data.venueName ? `<p style="margin:0;font-size:13px;color:#64748b;">${data.venueName}</p>` : ""}
      </div>

      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-bottom:16px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#92400e;font-weight:500;">${windowLabel}</p>
        <p style="margin:0;font-size:16px;font-weight:600;color:#78350f;">Starts at ${startTime}</p>
      </div>

      ${codeBlock}
      ${signupBlock}

      <div style="text-align:center;margin-top:20px;">
        <a href="${APP_URL}/events/${data.eventSlug}" style="display:inline-block;padding:10px 24px;background:#047857;color:#ffffff;border-radius:8px;font-size:14px;font-weight:500;text-decoration:none;">
          View Event
        </a>
      </div>

      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
      <p style="font-size:11px;color:#94a3b8;text-align:center;">
        You're receiving this because you have this event or artist on your TicketScout watchlist.
      </p>
    </div>
  `;

  await resend.emails.send({
    from: "TicketScout <onboarding@resend.dev>",
    to,
    subject: `Presale starting soon: ${data.eventName}`,
    html,
  });
}
