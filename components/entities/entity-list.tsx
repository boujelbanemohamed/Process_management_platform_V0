"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Users, FolderOpen, Eye, Edit, Trash2, Search } from "lucide-react"
import Link from "next/link"
import { entities } from "@/lib/data"
import { useAuth } from "@/lib/auth"

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

export function EntityList() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const filteredEntities = entities.filter((entity) => {
    const matchesSearch =
      entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || entity.type === typeFilter
    return matchesSearch && matchesType
  })

  const canEdit = user?.role === "admin" || user?.role === "contributor"

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une entité..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type d'entité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="department">Départements</SelectItem>
            <SelectItem value="team">Équipes</SelectItem>
            <SelectItem value="project">Projets</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEntities.map((entity) => {
          const Icon = typeIcons[entity.type]
          return (
            <Card key={entity.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{entity.name}</CardTitle>
                  </div>
                  <Badge className={typeColors[entity.type]}>{typeLabels[entity.type]}</Badge>
                </div>
                <CardDescription className="line-clamp-2">{entity.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {entity.processes.length} processus associé{entity.processes.length > 1 ? "s" : ""}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/entities/${entity.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {canEdit && (
                      <>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/entities/${entity.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredEntities.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Aucune entité trouvée</p>
        </div>
      )}
    </div>
  )
}
