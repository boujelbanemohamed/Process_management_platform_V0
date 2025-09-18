import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StatusManagement } from "@/components/admin/status-management"

export default function StatusesPage() {
  return (
    <DashboardLayout>
      <StatusManagement />
    </DashboardLayout>
  )
}
