import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DocumentList } from "@/components/documents/document-list"

export default function DocumentsPage() {
  return (
    <DashboardLayout>
      <DocumentList />
    </DashboardLayout>
  )
}
