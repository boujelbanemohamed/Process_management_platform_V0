import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProcessDetail } from "@/components/processes/process-detail"

interface ProcessPageProps {
  params: {
    id: string
  }
}

export default function ProcessPage({ params }: ProcessPageProps) {
  return (
    <DashboardLayout>
      <ProcessDetail processId={params.id} />
    </DashboardLayout>
  )
}
