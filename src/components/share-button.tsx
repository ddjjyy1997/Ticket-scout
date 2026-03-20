"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Link2, Check, Mail, MessageSquare } from "lucide-react";

interface ShareButtonProps {
  url: string;
  title: string;
}

export function ShareButton({ url, title }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const fullUrl = typeof window !== "undefined"
    ? `${window.location.origin}${url}`
    : url;

  async function copyLink() {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1500);
  }

  function shareX() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`,
      "_blank",
      "width=550,height=420"
    );
    setOpen(false);
  }

  async function shareNative() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: fullUrl });
        setOpen(false);
        return true;
      } catch {}
    }
    return false;
  }

  function shareText() {
    window.location.href = `sms:?body=${encodeURIComponent(`Check out this presale: ${title}\n${fullUrl}`)}`;
    setOpen(false);
  }

  function shareEmail() {
    window.location.href = `mailto:?subject=${encodeURIComponent(`Presale Alert: ${title}`)}&body=${encodeURIComponent(`Check out this presale on TicketScout:\n\n${title}\n${fullUrl}\n\nGet presale codes, alerts, and more at TicketScout.ca`)}`;
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-border bg-card p-1 shadow-lg">
          <button
            onClick={copyLink}
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy Link"}
          </button>
          <button
            onClick={shareX}
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X
          </button>
          <button
            onClick={shareText}
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            Text
          </button>
          <button
            onClick={shareEmail}
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Mail className="h-4 w-4" />
            Email
          </button>
        </div>
      )}
    </div>
  );
}
