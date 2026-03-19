export const dynamic = "force-dynamic";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Database,
  Calendar,
  Music,
  MapPin,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { getRecentScanRuns, getAdminStats, getApiUsageByDay } from "@/db/queries/admin";
import { format, formatDistanceToNow } from "date-fns";
import { TriggerScanButton, TriggerCodeScanButton } from "./trigger-scan";

function scanStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
          <CheckCircle className="mr-1 h-3 w-3" />
          {status}
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="mr-1 h-3 w-3" />
          {status}
        </Badge>
      );
    case "running":
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          <Clock className="mr-1 h-3 w-3" />
          {status}
        </Badge>
      );
    default:
      return (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200">
          <AlertTriangle className="mr-1 h-3 w-3" />
          {status}
        </Badge>
      );
  }
}

export default async function AdminPage() {
  const [stats, scanHistory, apiUsage] = await Promise.all([
    getAdminStats(),
    getRecentScanRuns(15),
    getApiUsageByDay(7),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Shield className="h-6 w-6 text-primary" />
          Admin
        </h1>
        <p className="text-muted-foreground">
          Manage scans, view logs, and monitor API usage.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Events
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.events}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Artists
            </CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.artists}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Venues
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.venues}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Scans
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              API Calls Today
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayApiCalls}</div>
            <p className="text-xs text-muted-foreground">of 5,000 TM limit</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Scan History */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Scan History</CardTitle>
            <CardDescription>Recent event scan runs</CardDescription>
          </CardHeader>
          <CardContent>
            {scanHistory.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No scans have been run yet.
              </p>
            ) : (
              <div className="space-y-2">
                {scanHistory.map((scan) => (
                  <div
                    key={scan.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {scanStatusBadge(scan.status)}
                        <span className="text-xs text-muted-foreground">
                          {scan.triggeredBy}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(scan.startedAt, "MMM d, yyyy 'at' h:mm a")}
                        {scan.completedAt && (
                          <> — {formatDistanceToNow(scan.completedAt, { addSuffix: true })}</>
                        )}
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <p>
                        <span className="text-muted-foreground">Found:</span>{" "}
                        <span className="font-medium">{scan.eventsFound}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Created:</span>{" "}
                        <span className="font-medium text-emerald-600">
                          {scan.eventsCreated}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Updated:</span>{" "}
                        <span className="font-medium">{scan.eventsUpdated}</span>
                      </p>
                      {scan.durationMs && (
                        <p className="text-muted-foreground">
                          {(scan.durationMs / 1000).toFixed(1)}s
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions & API Usage */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual Scan</CardTitle>
              <CardDescription>
                Trigger a Ticketmaster scan for all Toronto venues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <TriggerScanButton />
              <TriggerCodeScanButton />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Usage (7 days)</CardTitle>
            </CardHeader>
            <CardContent>
              {apiUsage.length === 0 ? (
                <p className="text-sm text-muted-foreground">No API calls logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {apiUsage.map((row, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{row.date}</span>
                        <Badge variant="outline" className="text-xs">
                          {row.source}
                        </Badge>
                      </div>
                      <span className="font-medium">{row.count} calls</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Provider</span>
                <Badge variant="outline">
                  <Database className="mr-1 h-3 w-3" />
                  Neon Postgres
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  Connected
                </Badge>
              </div>
              {stats.lastScan?.completedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Scan</span>
                  <span>
                    {formatDistanceToNow(stats.lastScan.completedAt, {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
