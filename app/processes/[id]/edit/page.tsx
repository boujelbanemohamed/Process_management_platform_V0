import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProcessForm } from "@/components/processes/process-form"

interface EditProcessPageProps {
  params: {
    id: string
  }
}

export default function EditProcessPage({ params }: EditProcessPageProps) {
  return (
    <DashboardLayout>
      <ProcessForm processId={params.id} mode="edit" />
    </DashboardLayout>
  )
}
