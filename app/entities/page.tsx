import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Building2, Users, FolderOpen } from "lucide-react"
import Link from "next/link"
import { EntityList } from "@/components/entities/entity-list"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

// Forcer le rendu dynamique pour éviter le cache
export const dynamic = 'force-dynamic'

export default function EntitiesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Entités</h1>
            <p className="text-muted-foreground">Gérez les départements, équipes et projets de votre organisation</p>
          </div>
          <Button asChild>
            <Link href="/entities/create">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle entité
            </Link>
          </Button>
        </div>

        <Suspense fallback={<div>Chargement...</div>}>
          <EntityList />
        </Suspense>
      </div>
    </DashboardLayout>
  )
}
