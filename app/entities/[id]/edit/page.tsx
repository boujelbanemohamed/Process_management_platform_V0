import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EntityForm } from "@/components/entities/entity-form"

interface EditEntityPageProps {
  params: {
    id: string
  }
}

export const dynamic = 'force-dynamic'

export default function EditEntityPage({ params }: EditEntityPageProps) {
  return (
    <DashboardLayout>
      <EntityForm entityId={params.id} mode="edit" />
    </DashboardLayout>
  )
}
