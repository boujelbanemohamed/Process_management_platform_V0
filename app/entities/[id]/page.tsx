import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EntityDetail } from "@/components/entities/entity-detail"

// Forcer le rendu dynamique pour éviter le cache
export const dynamic = 'force-dynamic'

interface EntityPageProps {
  params: {
    id: string
  }
}

async function getEntity(id: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/entities?id=${id}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching entity:', error)
    return null
  }
}

export default async function EntityPage({ params }: EntityPageProps) {
  const entity = await getEntity(params.id)

  if (!entity) {
    notFound()
  }

  return (
    <DashboardLayout>
      <EntityDetail entity={entity} />
    </DashboardLayout>
  )
}
