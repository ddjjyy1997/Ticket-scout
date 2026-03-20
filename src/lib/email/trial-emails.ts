import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTrialWarningEmail(to: string, daysLeft: number) {
  await resend.emails.send({
    from: "TicketScout <noreply@ticketscout.ca>",
    to,
    subject: `Your TicketScout trial ends in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Your trial is ending soon</h2>
        <p>Your TicketScout Pro trial ends in <strong>${daysLeft} day${daysLeft > 1 ? "s" : ""}</strong>.</p>
        <p>To keep getting presale alerts, email notifications, and priority scoring, upgrade to Pro before your trial expires.</p>
        <a href="https://www.ticketscout.ca/settings" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Manage Subscription
        </a>
        <p style="margin-top: 24px; color: #666; font-size: 13px;">
          If you don't upgrade, your account will switch to the Free plan automatically. You won't lose any data.
        </p>
      </div>
    `,
  });
}

export async function sendTrialExpiredEmail(to: string) {
  await resend.emails.send({
    from: "TicketScout <noreply@ticketscout.ca>",
    to,
    subject: "Your TicketScout trial has ended",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Your trial has ended</h2>
        <p>Your TicketScout Pro trial has expired. Your account has been switched to the Free plan.</p>
        <p>You can upgrade anytime to get back presale alerts, email notifications, presale codes, and priority scoring.</p>
        <a href="https://www.ticketscout.ca/settings" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Upgrade to Pro
        </a>
        <p style="margin-top: 24px; color: #666; font-size: 13px;">
          All your saved views and watchlists are still there — they'll be waiting for you.
        </p>
      </div>
    `,
  });
}
