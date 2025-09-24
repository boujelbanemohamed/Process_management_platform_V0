import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CategoryManagement } from "@/components/admin/category-management"

export const dynamic = 'force-dynamic'

export default function CategoriesPage() {
  return (
    <DashboardLayout>
      <CategoryManagement />
    </DashboardLayout>
  )
}
