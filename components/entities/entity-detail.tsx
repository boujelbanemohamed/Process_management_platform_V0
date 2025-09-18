"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Users, FolderOpen, Edit, ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"
import type { Entity } from "@/types"
import { useAuth } from "@/lib/auth"
import { processes } from "@/lib/data"

interface EntityDetailProps {
  entity: Entity
}

const typeIcons = {
  department: Building2,
  team: Users,
  project: FolderOpen,
}

const typeLabels = {
  department: "Département",
  team: "Équipe",
  project: "Projet",
}

const typeColors = {
  department: "bg-blue-100 text-blue-800",
  team: "bg-green-100 text-green-800",
  project: "bg-purple-100 text-purple-800",
}

export function EntityDetail({ entity }: EntityDetailProps) {
  const { user } = useAuth()
  const Icon = typeIcons[entity.type]
  const canEdit = user?.role === "admin" || user?.role === "contributor"

  // Get associated processes
  const associatedProcesses = processes.filter((process) => entity.processes.includes(process.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/entities">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Icon className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-3xl font-bold tracking-tight">{entity.name}</h1>
            <Badge className={typeColors[entity.type]}>{typeLabels[entity.type]}</Badge>
          </div>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href={`/entities/${entity.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{entity.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Processus associés</CardTitle>
              <CardDescription>
                {associatedProcesses.length} processus lié{associatedProcesses.length > 1 ? "s" : ""} à cette entité
              </CardDescription>
            </CardHeader>
            <CardContent>
              {associatedProcesses.length > 0 ? (
                <div className="space-y-3">
                  {associatedProcesses.map((process) => (
                    <div key={process.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{process.name}</p>
                          <p className="text-sm text-muted-foreground">{process.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{process.category}</Badge>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/processes/${process.id}`}>Voir</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Aucun processus associé</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Type</p>
                <p className="text-sm text-muted-foreground">{typeLabels[entity.type]}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Identifiant</p>
                <p className="text-sm text-muted-foreground font-mono">{entity.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Processus associés</p>
                <p className="text-sm text-muted-foreground">{entity.processes.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                <Link href="/processes/create">
                  <FileText className="mr-2 h-4 w-4" />
                  Créer un processus
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                <Link href={`/search?q=${encodeURIComponent(entity.name)}`}>Rechercher dans l'entité</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
