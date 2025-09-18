import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DocumentViewer } from "@/components/documents/document-viewer"

interface DocumentPageProps {
  params: {
    id: string
  }
}

export default function DocumentPage({ params }: DocumentPageProps) {
  return (
    <DashboardLayout>
      <DocumentViewer documentId={params.id} />
    </DashboardLayout>
  )
}
