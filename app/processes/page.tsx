import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProcessList } from "@/components/processes/process-list"

export default function ProcessesPage() {
  return (
    <DashboardLayout>
      <ProcessList />
    </DashboardLayout>
  )
}
