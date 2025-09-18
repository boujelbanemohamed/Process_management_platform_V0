import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EntityForm } from "@/components/entities/entity-form"
import { entities } from "@/lib/data"

interface EditEntityPageProps {
  params: {
    id: string
  }
}

export default function EditEntityPage({ params }: EditEntityPageProps) {
  const entity = entities.find((e) => e.id === params.id)

  if (!entity) {
    notFound()
  }

  return (
    <DashboardLayout>
      <EntityForm entity={entity} />
    </DashboardLayout>
  )
}
