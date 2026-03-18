"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, RefreshCw, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export function TriggerScanButton() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function triggerScan() {
    setScanning(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/trigger-scan", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setResult(
          `Found: ${data.eventsFound ?? 0}, Created: ${data.eventsCreated ?? 0}, Updated: ${data.eventsUpdated ?? 0}`
        );
        router.refresh();
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch {
      setResult("Failed to trigger scan");
    }
    setScanning(false);
  }

  return (
    <div className="space-y-3">
      <Button onClick={triggerScan} disabled={scanning} className="w-full">
        {scanning ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Scanning...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Run Event Scan
          </>
        )}
      </Button>
      {result && (
        <p className="text-xs text-muted-foreground">{result}</p>
      )}
    </div>
  );
}

export function TriggerCodeScanButton() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function triggerCodeScan() {
    setScanning(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/trigger-code-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(
          `Scanned: ${data.eventsScanned ?? 0} events, Found: ${data.codesFound ?? 0} codes, New: ${data.codesInserted ?? 0}`
        );
        router.refresh();
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch {
      setResult("Failed to trigger code scan");
    }
    setScanning(false);
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={triggerCodeScan}
        disabled={scanning}
        variant="outline"
        className="w-full"
      >
        {scanning ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Scanning Codes...
          </>
        ) : (
          <>
            <Search className="mr-2 h-4 w-4" />
            Scan Presale Codes
          </>
        )}
      </Button>
      {result && (
        <p className="text-xs text-muted-foreground">{result}</p>
      )}
    </div>
  );
}
