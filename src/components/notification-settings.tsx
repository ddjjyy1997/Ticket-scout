"use client";

import { useState, useEffect } from "react";
import { MapPin, Bell, Mail, Loader2 } from "lucide-react";

interface CityOption {
  city: string;
  label: string;
}

export function NotificationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    pushNotifications: true,
    notifyOnsale: true,
    notifyPriceDrop: true,
    notifyNewEvents: true,
    notifyCity: null as string | null,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/preferences").then((r) => r.json()),
      fetch("/api/venues/cities").then((r) => r.json()),
    ]).then(([prefsData, citiesData]) => {
      setPrefs(prefsData);
      setCities(citiesData);
      setLoading(false);
    });
  }, []);

  async function updatePref(key: string, value: unknown) {
    setPrefs((p) => ({ ...p, [key]: value }));
    setSaving(true);
    await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading preferences...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Location-based alerts */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">Location Alerts</p>
            <p className="text-xs text-muted-foreground">
              Get automatic notifications for new events and presales in your city.
            </p>
            <select
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={prefs.notifyCity ?? ""}
              onChange={(e) => updatePref("notifyCity", e.target.value || null)}
            >
              <option value="">Select your city...</option>
              {cities.map((c) => (
                <option key={c.city} value={c.city}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notification toggles */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <ToggleRow
          icon={<Bell className="h-4 w-4 text-amber-600" />}
          label="Presale alerts"
          description="Get notified when presales are about to start"
          checked={prefs.notifyOnsale}
          onChange={(v) => updatePref("notifyOnsale", v)}
        />
        <ToggleRow
          icon={<Bell className="h-4 w-4 text-blue-600" />}
          label="New event alerts"
          description="Get notified when new events match your watchlist or city"
          checked={prefs.notifyNewEvents}
          onChange={(v) => updatePref("notifyNewEvents", v)}
        />
        <ToggleRow
          icon={<Bell className="h-4 w-4 text-emerald-600" />}
          label="Price drop alerts"
          description="Get notified when resale prices drop significantly"
          checked={prefs.notifyPriceDrop}
          onChange={(v) => updatePref("notifyPriceDrop", v)}
        />
        <div className="border-t border-border pt-3" />
        <ToggleRow
          icon={<Mail className="h-4 w-4 text-muted-foreground" />}
          label="Email notifications"
          description="Receive notification digests via email"
          checked={prefs.emailNotifications}
          onChange={(v) => updatePref("emailNotifications", v)}
        />
      </div>

      {saving && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" /> Saving...
        </p>
      )}
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      {icon}
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}
