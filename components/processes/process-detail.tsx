"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockProcesses, mockDocuments } from "@/lib/data"
import { AuthService } from "@/lib/auth"
import { ArrowLeft, Edit, Archive, FileText, Users, Calendar, Tag } from "lucide-react"
import type { Process } from "@/types"

interface ProcessDetailProps {
  processId: string
}

export function ProcessDetail({ processId }: ProcessDetailProps) {
  const router = useRouter()
  const [process] = useState<Process | undefined>(mockProcesses.find((p) => p.id === processId))

  const canWrite = AuthService.hasPermission("write")
  const canAdmin = AuthService.hasPermission("admin")

  if (!process) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
        <Card className="border-slate-200">
          <CardContent className="p-8 text-center">
            <p className="text-slate-500">Processus non trouvé.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const processDocuments = mockDocuments.filter((doc) => doc.processId === process.id)

  const getStatusColor = (status: Process["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "archived":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusLabel = (status: Process["status"]) => {
    switch (status) {
      case "active":
        return "Actif"
      case "draft":
        return "Brouillon"
      case "archived":
        return "Archivé"
      default:
        return status
    }
  }

  const handleEdit = () => {
    router.push(`/processes/${process.id}/edit`)
  }

  const handleArchive = () => {
    // TODO: Implement archive functionality
    console.log("[v0] Archive process:", process.id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 text-balance">{process.name}</h1>
            <p className="text-slate-600 mt-1 text-pretty">{process.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(process.status)}>{getStatusLabel(process.status)}</Badge>
          {canWrite && (
            <Button onClick={handleEdit} className="bg-slate-800 hover:bg-slate-700">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          )}
          {canAdmin && (
            <Button variant="outline" onClick={handleArchive}>
              <Archive className="h-4 w-4 mr-2" />
              Archiver
            </Button>
          )}
        </div>
      </div>

      {/* Process Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-600">Catégorie</span>
            </div>
            <p className="text-slate-800 font-semibold mt-1">{process.category}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-600">Créé le</span>
            </div>
            <p className="text-slate-800 font-semibold mt-1">{process.createdAt.toLocaleDateString()}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-600">Modifié le</span>
            </div>
            <p className="text-slate-800 font-semibold mt-1">{process.updatedAt.toLocaleDateString()}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-600">Documents</span>
            </div>
            <p className="text-slate-800 font-semibold mt-1">{processDocuments.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tags */}
      {process.tags.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {process.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">Documents ({processDocuments.length})</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          {processDocuments.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {processDocuments.map((document) => (
                <Card key={document.id} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-slate-500" />
                        <div>
                          <h3 className="font-medium text-slate-800">{document.name}</h3>
                          <p className="text-sm text-slate-500">
                            Version {document.version} • {(document.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          Télécharger
                        </Button>
                        <Button variant="ghost" size="sm">
                          Voir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-slate-200">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Aucun document associé à ce processus.</p>
                {canWrite && (
                  <Button className="mt-4" onClick={() => router.push("/documents/upload")}>
                    Ajouter un document
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity">
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">L'historique d'activité sera disponible prochainement.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="border-slate-200">
            <CardContent className="p-8 text-center">
              <p className="text-slate-500">Les paramètres avancés seront disponibles prochainement.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
