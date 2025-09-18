import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProcessForm } from "@/components/processes/process-form"

export default function CreateProcessPage() {
  return (
    <DashboardLayout>
      <ProcessForm mode="create" />
    </DashboardLayout>
  )
}
