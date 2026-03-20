import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { NotificationsClient } from "./notifications-client";
import { PushToggle } from "@/components/push-toggle";
import { NotificationSettings } from "@/components/notification-settings";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const items = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(100);

  const serialized = items.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    eventId: n.eventId,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            All your alerts for watchlist matches, new events, and presales.
          </p>
        </div>
        <PushToggle />
      </div>
      <NotificationSettings />
      <NotificationsClient initialNotifications={serialized} />
    </div>
  );
}
