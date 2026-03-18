import { db } from "@/db";
import { presaleCodes, presaleCodeVotes } from "@/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

export interface PresaleCodeRow {
  id: number;
  eventId: number;
  onsaleWindowId: number | null;
  code: string;
  source: string;
  submittedBy: string | null;
  confirmedWorking: number;
  confirmedNotWorking: number;
  confidence: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  userVote: string | null; // current user's vote
}

export async function getCodesForEvent(
  eventId: number,
  userId?: string
): Promise<PresaleCodeRow[]> {
  const codes = await db
    .select()
    .from(presaleCodes)
    .where(eq(presaleCodes.eventId, eventId))
    .orderBy(desc(presaleCodes.confirmedWorking), desc(presaleCodes.createdAt));

  if (!userId || codes.length === 0) {
    return codes.map((c) => ({ ...c, userVote: null }));
  }

  // Get this user's votes for these codes
  const codeIds = codes.map((c) => c.id);
  const votes = await db
    .select({
      codeId: presaleCodeVotes.codeId,
      vote: presaleCodeVotes.vote,
    })
    .from(presaleCodeVotes)
    .where(
      and(
        eq(presaleCodeVotes.userId, userId),
        inArray(presaleCodeVotes.codeId, codeIds)
      )
    );

  const voteMap = new Map(votes.map((v) => [v.codeId, v.vote]));

  return codes.map((c) => ({
    ...c,
    userVote: voteMap.get(c.id) ?? null,
  }));
}

export async function submitCode(params: {
  eventId: number;
  onsaleWindowId?: number | null;
  code: string;
  source: "admin" | "user" | "scraped";
  submittedBy: string;
  notes?: string | null;
}): Promise<{ id: number }> {
  const status = params.source === "admin" ? "verified" : "pending";
  const confidence = params.source === "admin" ? "100" : "0";

  const [row] = await db
    .insert(presaleCodes)
    .values({
      eventId: params.eventId,
      onsaleWindowId: params.onsaleWindowId ?? null,
      code: params.code.trim().toUpperCase(),
      source: params.source,
      submittedBy: params.submittedBy,
      notes: params.notes ?? null,
      status,
      confidence,
    })
    .returning({ id: presaleCodes.id });

  return row;
}

export async function voteOnCode(params: {
  codeId: number;
  userId: string;
  vote: "working" | "not_working";
}): Promise<{ confidence: string; status: string }> {
  // Upsert vote
  await db
    .insert(presaleCodeVotes)
    .values({
      codeId: params.codeId,
      userId: params.userId,
      vote: params.vote,
    })
    .onConflictDoUpdate({
      target: [presaleCodeVotes.codeId, presaleCodeVotes.userId],
      set: { vote: params.vote, createdAt: new Date() },
    });

  // Recount votes
  const [working] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(presaleCodeVotes)
    .where(
      and(
        eq(presaleCodeVotes.codeId, params.codeId),
        eq(presaleCodeVotes.vote, "working")
      )
    );

  const [notWorking] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(presaleCodeVotes)
    .where(
      and(
        eq(presaleCodeVotes.codeId, params.codeId),
        eq(presaleCodeVotes.vote, "not_working")
      )
    );

  const w = Number(working.count);
  const nw = Number(notWorking.count);
  const total = w + nw;
  const confidence = total > 0 ? Math.round((w / total) * 100) : 0;

  // Auto-verify/fake with 3+ votes
  let status = "pending";
  if (total >= 3 && confidence >= 70) status = "verified";
  else if (total >= 3 && confidence <= 20) status = "fake";

  // Update the code
  await db
    .update(presaleCodes)
    .set({
      confirmedWorking: w,
      confirmedNotWorking: nw,
      confidence: String(confidence),
      status,
    })
    .where(eq(presaleCodes.id, params.codeId));

  return { confidence: String(confidence), status };
}

export async function getCodeCountsForEvents(
  eventIds: number[]
): Promise<Map<number, number>> {
  if (eventIds.length === 0) return new Map();

  const rows = await db
    .select({
      eventId: presaleCodes.eventId,
      count: sql<number>`COUNT(*)`,
    })
    .from(presaleCodes)
    .where(inArray(presaleCodes.eventId, eventIds))
    .groupBy(presaleCodes.eventId);

  return new Map(rows.map((r) => [r.eventId, Number(r.count)]));
}
