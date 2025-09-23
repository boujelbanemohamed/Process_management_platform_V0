import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EntityDetail } from "@/components/entities/entity-detail"

// Forcer le rendu dynamique pour éviter le cache
export const dynamic = 'force-dynamic'

interface EntityPageProps {
  params: {
    id: string
  }
}

export default function EntityPage({ params }: EntityPageProps) {
  return (
    <DashboardLayout>
      <EntityDetail entityId={params.id} />
    </DashboardLayout>
  )
}
