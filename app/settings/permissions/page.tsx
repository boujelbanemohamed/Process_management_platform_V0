import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SimplePermissionMatrix } from "@/components/admin/simple-permissions-matrix"

export default function PermissionsPage() {
  return (
    <DashboardLayout>
      <SimplePermissionMatrix />
    </DashboardLayout>
  )
}
