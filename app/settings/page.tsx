import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserManagement } from "@/components/admin/user-management"

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <UserManagement />
    </DashboardLayout>
  )
}
