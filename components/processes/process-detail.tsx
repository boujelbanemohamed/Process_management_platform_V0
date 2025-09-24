"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthService } from "@/lib/auth"
import { ArrowLeft, Edit, Archive, FileText, Users, Calendar, Tag, Eye, Download, Upload, Plus } from "lucide-react"

interface ProcessDetailProps {
  processId: string
}

interface Process {
  id: string
  name: string
  description: string
  status: string
  category: string
  created_at: string
  updated_at: string
  tags: string[]
  created_by_name?: string
  entities?: any[]
  entity_ids?: number[]
}

interface Document {
  id: string
  name: string
  type: string
  size: number
  version: string
  url: string
  description: string
  uploaded_at: string
  uploaded_by_name?: string
}

export function ProcessDetail({ processId }: ProcessDetailProps) {
  const router = useRouter()
  const [process, setProcess] = useState<Process | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const canWrite = AuthService.hasPermission("write")
  const canAdmin = AuthService.hasPermission("admin")

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Charger le processus
        const processRes = await fetch(`/api/processes?id=${processId}`)
        if (!processRes.ok) throw new Error("Erreur lors du chargement du processus")
        const processData = await processRes.json()
        
        // Normaliser les données du processus
        const normalizedProcess: Process = {
          id: String(processData.id),
          name: processData.name || "Sans nom",
          description: processData.description || "",
          status: processData.status || "draft",
          category: processData.category || "Général",
          created_at: processData.created_at || new Date().toISOString(),
          updated_at: processData.updated_at || new Date().toISOString(),
          tags: processData.tags || [],
          created_by_name: processData.created_by_name,
          entities: processData.entities || [],
          entity_ids: processData.entity_ids || []
        }
        setProcess(normalizedProcess)
        
        // Charger les documents du processus
        const docsRes = await fetch(`/api/documents?processId=${processId}`)
        if (docsRes.ok) {
          const docsData = await docsRes.json()
          const normalizedDocs: Document[] = Array.isArray(docsData) ? docsData.map((doc: any) => ({
            id: String(doc.id),
            name: doc.name || "Sans nom",
            type: doc.type || "unknown",
            size: doc.size || 0,
            version: doc.version || "1.0",
            url: doc.url || "#",
            description: doc.description || "",
            uploaded_at: doc.uploaded_at || new Date().toISOString(),
            uploaded_by_name: doc.uploaded_by_name
          })) : []
          setDocuments(normalizedDocs)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue")
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [processId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    )
  }

  if (error || !process) {
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
            <p className="text-slate-500">{error || "Processus non trouvé."}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusColor = (status: string) => {
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

  const getStatusLabel = (status: string) => {
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

  const handleDownload = (document: Document) => {
    if (document.url && document.url !== '#') {
      // Essayer d'abord le téléchargement direct
      const link = document.createElement('a')
      link.href = document.url
      link.download = document.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      // Fallback vers l'API de téléchargement
      window.open(`/api/documents/download?id=${document.id}`, '_blank')
    }
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
            <p className="text-slate-800 font-semibold mt-1">{new Date(process.created_at).toLocaleDateString('fr-FR')}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-600">Modifié le</span>
            </div>
            <p className="text-slate-800 font-semibold mt-1">{new Date(process.updated_at).toLocaleDateString('fr-FR')}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-600">Documents</span>
            </div>
            <p className="text-slate-800 font-semibold mt-1">{documents.length}</p>
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

      {/* Entités affiliées */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Entités affiliées
          </CardTitle>
        </CardHeader>
        <CardContent>
          {process.entities && process.entities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {process.entities.map((entity: any) => (
                <div key={entity.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{entity.name}</p>
                    <p className="text-sm text-slate-500 capitalize">{entity.type}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/entities/${entity.id}`}>
                      <Eye className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Aucune entité affiliée à ce processus</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">
              Documents ({documents.length})
            </h3>
            {canWrite && (
              <Button 
                onClick={() => router.push(`/documents/upload?processId=${processId}`)}
                className="bg-slate-800 hover:bg-slate-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un document
              </Button>
            )}
          </div>
          
          {documents.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {documents.map((document) => (
                <Card key={document.id} className="border-slate-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-slate-500" />
                        <div>
                          <CardTitle className="text-base">{document.name}</CardTitle>
                          <p className="text-sm text-slate-500">
                            Version {document.version} • {formatFileSize(document.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => router.push(`/documents/${document.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => router.push(`/documents/${document.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownload(document)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Aperçu du document */}
                    <div className="bg-slate-50 rounded-lg p-4 mb-4 min-h-32 flex items-center justify-center">
                      {document.url && document.url !== '#' ? (
                        <div className="w-full">
                          {document.type?.toLowerCase().includes('pdf') ? (
                            <iframe
                              src={document.url}
                              className="w-full h-32 border-0 rounded"
                              title="Aperçu PDF"
                            />
                          ) : document.type?.toLowerCase().includes('image') ? (
                            <img
                              src={document.url}
                              alt="Aperçu"
                              className="max-w-full max-h-32 mx-auto rounded"
                            />
                          ) : (
                            <div className="text-center">
                              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                              <p className="text-sm text-slate-600">{document.type?.toUpperCase() || 'UNKNOWN'}</p>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="mt-2"
                                onClick={() => window.open(document.url, '_blank')}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ouvrir
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center">
                          <FileText className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-600">Aucun aperçu disponible</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Description */}
                    {document.description && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-slate-700 mb-1">Description</p>
                        <p className="text-sm text-slate-600 line-clamp-2">{document.description}</p>
                      </div>
                    )}
                    
                    {/* Métadonnées */}
                    <div className="text-xs text-slate-500 space-y-1">
                      <p>Ajouté le {new Date(document.uploaded_at).toLocaleDateString('fr-FR')}</p>
                      {document.uploaded_by_name && (
                        <p>Par {document.uploaded_by_name}</p>
                      )}
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
                  <Button 
                    className="mt-4" 
                    onClick={() => router.push(`/documents/upload?processId=${processId}`)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
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
