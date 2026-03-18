"use client";

import { useState } from "react";
import { Pencil, Check, X, Link2 } from "lucide-react";

interface SignupUrlEditorProps {
  windowId: number;
  currentUrl: string | null;
}

export function SignupUrlEditor({ windowId, currentUrl }: SignupUrlEditorProps) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(currentUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState(currentUrl);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/presale-signup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ windowId, signupUrl: url }),
      });
      if (res.ok) {
        setSavedUrl(url || null);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="mt-1 flex items-center gap-1">
        <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://signup-url..."
          className="h-6 flex-1 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
        />
        <button
          onClick={save}
          disabled={saving}
          className="rounded p-0.5 text-emerald-600 hover:bg-emerald-50"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setEditing(false)}
          className="rounded p-0.5 text-muted-foreground hover:bg-muted"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
      title={savedUrl ? `Edit signup URL: ${savedUrl}` : "Add signup URL"}
    >
      <Pencil className="h-2.5 w-2.5" />
      {savedUrl ? "Edit signup link" : "Add signup link"}
    </button>
  );
}
