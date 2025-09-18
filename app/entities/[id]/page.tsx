import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EntityDetail } from "@/components/entities/entity-detail"
import { entities } from "@/lib/data"

interface EntityPageProps {
  params: {
    id: string
  }
}

export default function EntityPage({ params }: EntityPageProps) {
  const entity = entities.find((e) => e.id === params.id)

  if (!entity) {
    notFound()
  }

  return (
    <DashboardLayout>
      <EntityDetail entity={entity} />
    </DashboardLayout>
  )
}
