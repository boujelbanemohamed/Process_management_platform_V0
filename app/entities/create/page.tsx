import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EntityForm } from "@/components/entities/entity-form"

export default function CreateEntityPage() {
  return (
    <DashboardLayout>
      <EntityForm mode="create" />
    </DashboardLayout>
  )
}
