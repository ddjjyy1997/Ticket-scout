import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function ScanLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scan Logs</h1>
        <p className="text-muted-foreground">
          Detailed logs from event ingestion scans.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Scan Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No scans have been run yet. Trigger a scan from the Admin page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
