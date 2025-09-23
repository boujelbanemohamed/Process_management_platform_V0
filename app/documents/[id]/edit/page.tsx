import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DocumentEditForm } from "@/components/documents/document-edit-form"

export const dynamic = "force-dynamic"

interface DocumentEditPageProps {
  params: {
    id: string
  }
}

export default function DocumentEditPage({ params }: DocumentEditPageProps) {
  return (
    <DashboardLayout>
      <DocumentEditForm documentId={params.id} />
    </DashboardLayout>
  )
}
