import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AccessLogs } from "@/components/admin/access-logs"

export default function AccessLogsPage() {
  return (
    <DashboardLayout>
      <AccessLogs />
    </DashboardLayout>
  )
}
