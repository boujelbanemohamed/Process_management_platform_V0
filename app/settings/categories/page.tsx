import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CategoryManagement } from "@/components/admin/category-management"

export default function CategoriesPage() {
  return (
    <DashboardLayout>
      <CategoryManagement />
    </DashboardLayout>
  )
}
