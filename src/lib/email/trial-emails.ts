import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTrialWarningEmail(to: string, daysRemaining: number) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#111;color:#eee;">
      <h2 style="margin:0 0 16px;font-size:18px;color:#fff;">Your Pro Trial Ends in ${daysRemaining} Day${daysRemaining > 1 ? "s" : ""}</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#ccc;">
        Your TicketScout Pro trial is ending soon. After your trial ends, you'll lose access to:
      </p>
      <ul style="margin:0 0 20px;padding-left:20px;font-size:13px;color:#aaa;">
        <li>Presale codes</li>
        <li>Email notifications for new events</li>
        <li>Unlimited saved views</li>
        <li>Priority scoring</li>
      </ul>
      <a href="${appUrl}/settings" style="display:inline-block;padding:10px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">
        Upgrade to Pro — $19/mo
      </a>
      <hr style="border:none;border-top:1px solid #333;margin:24px 0;" />
      <p style="font-size:11px;color:#666;">You're receiving this because you signed up for TicketScout.</p>
    </div>
  `;

  await resend.emails.send({
    from: "TicketScout <onboarding@resend.dev>",
    to,
    subject: `Your TicketScout Pro trial ends in ${daysRemaining} day${daysRemaining > 1 ? "s" : ""}`,
    html,
  });
}

export async function sendTrialExpiredEmail(to: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#111;color:#eee;">
      <h2 style="margin:0 0 16px;font-size:18px;color:#fff;">Your Pro Trial Has Ended</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#ccc;">
        Your TicketScout account has been downgraded to the Free plan. You can still browse events, but Pro features are now locked.
      </p>
      <a href="${appUrl}/settings" style="display:inline-block;padding:10px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">
        Upgrade to Pro
      </a>
      <hr style="border:none;border-top:1px solid #333;margin:24px 0;" />
      <p style="font-size:11px;color:#666;">You're receiving this because you signed up for TicketScout.</p>
    </div>
  `;

  await resend.emails.send({
    from: "TicketScout <onboarding@resend.dev>",
    to,
    subject: "Your TicketScout Pro trial has ended",
    html,
  });
}
