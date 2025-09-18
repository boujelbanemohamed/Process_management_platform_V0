import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PermissionsMatrix } from "@/components/admin/permissions-matrix"

export default function PermissionsPage() {
  return (
    <DashboardLayout>
      <PermissionsMatrix />
    </DashboardLayout>
  )
}
