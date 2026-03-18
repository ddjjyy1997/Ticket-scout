"use client";

import { useState, useEffect, useCallback } from "react";
import { ThumbsUp, ThumbsDown, Plus, Shield, User, Bot, Loader2 } from "lucide-react";
import { UpgradePrompt } from "@/components/upgrade-prompt";

interface PresaleCode {
  id: number;
  eventId: number;
  onsaleWindowId: number | null;
  code: string;
  source: string;
  confirmedWorking: number;
  confirmedNotWorking: number;
  confidence: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  userVote: string | null;
}

interface OnsaleWindow {
  id: number;
  windowType: string;
  windowName: string | null;
}

interface PresaleCodesProps {
  eventId: number;
  plan: string;
  onsaleWindows: OnsaleWindow[];
}

export function PresaleCodesSection({ eventId, plan, onsaleWindows }: PresaleCodesProps) {
  const [codes, setCodes] = useState<PresaleCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voting, setVoting] = useState<number | null>(null);

  // Form state
  const [newCode, setNewCode] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newWindowId, setNewWindowId] = useState<string>("");

  const isPro = plan === "pro";

  const fetchCodes = useCallback(async () => {
    if (!isPro) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/presale-codes?eventId=${eventId}`);
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "upgrade_required") {
          setLoading(false);
          return;
        }
        throw new Error(data.error);
      }
      setCodes(data.codes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load codes");
    } finally {
      setLoading(false);
    }
  }, [eventId, isPro]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/presale-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          onsaleWindowId: newWindowId ? Number(newWindowId) : null,
          code: newCode.trim(),
          notes: newNotes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNewCode("");
      setNewNotes("");
      setNewWindowId("");
      setShowForm(false);
      await fetchCodes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit code");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (codeId: number, vote: "working" | "not_working") => {
    setVoting(codeId);
    setError(null);
    try {
      const res = await fetch(`/api/presale-codes/${codeId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      await fetchCodes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to vote");
    } finally {
      setVoting(null);
    }
  };

  if (!isPro) {
    return <UpgradePrompt feature="presale codes" />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {/* Codes list */}
      {codes.length > 0 ? (
        <div className="space-y-2">
          {codes.map((code) => (
            <div
              key={code.id}
              className={`rounded-lg border p-3 ${
                code.status === "verified"
                  ? "border-emerald-200 bg-emerald-50"
                  : code.status === "fake"
                  ? "border-red-200 bg-red-50 opacity-60"
                  : "border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <code className="rounded bg-muted px-2 py-1 text-sm font-mono font-bold">
                    {code.code}
                  </code>
                  <StatusBadge status={code.status} />
                  <SourceBadge source={code.source} />
                </div>
                <ConfidenceBar confidence={Number(code.confidence ?? 0)} />
              </div>

              {code.notes && (
                <p className="mt-1 text-xs text-muted-foreground">{code.notes}</p>
              )}

              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {code.confirmedWorking} working · {code.confirmedNotWorking} not working
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleVote(code.id, "working")}
                    disabled={voting === code.id}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                      code.userVote === "working"
                        ? "bg-emerald-100 text-emerald-600"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <ThumbsUp className="h-3 w-3" />
                    Works
                  </button>
                  <button
                    onClick={() => handleVote(code.id, "not_working")}
                    disabled={voting === code.id}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                      code.userVote === "not_working"
                        ? "bg-red-100 text-red-600"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <ThumbsDown className="h-3 w-3" />
                    Doesn&apos;t Work
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No presale codes yet. Be the first to submit one!
        </p>
      )}

      {/* Submit form toggle */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-md border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Submit a Presale Code
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border p-4">
          <div>
            <label className="mb-1 block text-xs font-medium">Code *</label>
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="e.g. BRUNOFAN2026"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              required
            />
          </div>

          {onsaleWindows.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium">Onsale Window (optional)</label>
              <select
                value={newWindowId}
                onChange={(e) => setNewWindowId(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">— Select window —</option>
                {onsaleWindows.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.windowName ?? w.windowType}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium">Notes (optional)</label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="e.g. Works for AMEX presale"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting || !newCode.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Submit Code
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    verified: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
    expired: "bg-muted text-muted-foreground border border-border",
    fake: "bg-red-50 text-red-700 border border-red-200",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status] ?? styles.pending}`}>
      {status}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const icons: Record<string, React.ReactNode> = {
    admin: <Shield className="h-3 w-3" />,
    user: <User className="h-3 w-3" />,
    scraped: <Bot className="h-3 w-3" />,
  };
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
      {icons[source]}
      {source}
    </span>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const color =
    confidence >= 70
      ? "bg-emerald-500"
      : confidence >= 40
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{confidence}%</span>
    </div>
  );
}
