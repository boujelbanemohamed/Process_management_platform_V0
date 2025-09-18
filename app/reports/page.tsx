import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ReportGenerator } from "@/components/reports/report-generator"

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <ReportGenerator />
    </DashboardLayout>
  )
}
