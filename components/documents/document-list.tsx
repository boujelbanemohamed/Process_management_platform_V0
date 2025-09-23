"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AuthService } from "@/lib/auth"
import { Search, Upload, Download, Eye, Edit, Trash2, FileText, File, ImageIcon, Loader2 } from "lucide-react"
import type { Document } from "@/types"

export function DocumentList() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les documents depuis l'API
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/documents')
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des documents')
        }
        const data = await response.json()
        // Normaliser les champs venant de l'API (snake_case -> camelCase)
        const normalized = (Array.isArray(data) ? data : []).map((d: any) => {
          const mime = String(d.type || '').toLowerCase()
          const ext = mime.startsWith('application/pdf')
            ? 'pdf'
            : mime.includes('word') || mime.endsWith('/doc') || mime.endsWith('/docx')
            ? 'docx'
            : mime.includes('sheet') || mime.endsWith('/xls') || mime.endsWith('/xlsx')
            ? 'xlsx'
            : mime.includes('png')
            ? 'png'
            : mime.includes('jpeg') || mime.includes('jpg')
            ? 'jpg'
            : mime
          return {
            id: String(d.id),
            name: d.name,
            description: d.description || '',
            type: ext || 'file',
            size: Number(d.size || 0),
            version: d.version || '1.0',
            uploadedAt: d.uploaded_at ? new Date(d.uploaded_at) : new Date(),
            processId: String(d.process_id || ''),
            url: d.url || '#',
            processName: d.process_name || 'Processus inconnu',
          } as any
        })
        setDocuments(normalized as any)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
        console.error('Error fetching documents:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
  }, [])

  const canWrite = AuthService.hasPermission("write")
  const canAdmin = AuthService.hasPermission("admin")

  const fileTypes = ["all", ...Array.from(new Set(documents.map((d) => d.type)))]

  const filteredDocuments = documents.filter((document) => {
    const matchesSearch = document.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === "all" || document.type === selectedType
    return matchesSearch && matchesType
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des documents...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Erreur: {error}</p>
        <Button onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </div>
    )
  }

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />
      case "docx":
      case "doc":
        return <FileText className="h-5 w-5 text-blue-500" />
      case "xlsx":
      case "xls":
        return <File className="h-5 w-5 text-green-500" />
      case "png":
      case "jpg":
      case "jpeg":
        return <ImageIcon className="h-5 w-5 text-purple-500" />
      default:
        return <File className="h-5 w-5 text-slate-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getProcessName = (doc: any) => doc.processName || "Processus inconnu"

  const handleView = (documentId: string) => {
    router.push(`/documents/${documentId}`)
  }

  const handleEdit = (documentId: string) => {
    router.push(`/documents/${documentId}/edit`)
  }

  const handleDownload = (doc: Document) => {
    const link = window.document.createElement("a")
    link.href = doc.url
    link.download = doc.name
    link.click()
  }

  const handleDelete = async (documentId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      setDocuments(documents.filter((d) => d.id !== documentId))
    }
  }

  const handleUploadClick = () => {
    router.push("/documents/upload")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Documents</h1>
          <p className="text-slate-600 mt-1">Gérez vos documents et leurs versions</p>
        </div>
        {canWrite && (
          <Button className="bg-slate-800 hover:bg-slate-700" onClick={handleUploadClick}>
            <Upload className="h-4 w-4 mr-2" />
            Importer des documents
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Rechercher un document..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                {fileTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "all" ? "Tous les types" : type.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-800">Liste des documents</CardTitle>
          <CardDescription>{filteredDocuments.length} document(s) trouvé(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex-shrink-0">{getFileIcon(document.type)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-slate-800 truncate">{document.name}</h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-slate-500">Version {document.version}</span>
                      <span className="text-xs text-slate-500">{formatFileSize(document.size)}</span>
                      <span className="text-xs text-slate-500">{document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString('fr-FR') : '—'}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {getProcessName(document)}
                      </Badge>
                      {document.description && (
                        <span className="text-xs text-slate-500 truncate">{document.description}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" title="Prévisualiser" onClick={() => handleView(document.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Télécharger" onClick={() => handleDownload(document)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  {canWrite && (
                    <Button variant="ghost" size="sm" title="Modifier" onClick={() => handleEdit(document.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {canAdmin && (
                    <Button variant="ghost" size="sm" title="Supprimer" onClick={() => handleDelete(document.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500">Aucun document trouvé avec ces critères.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Zone */}
      {canWrite && (
        <Card className="border-slate-200 border-dashed">
          <CardContent className="p-8">
            <div className="text-center">
              <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">Importer des documents</h3>
              <p className="text-slate-500 mb-4">Glissez-déposez vos fichiers ici ou cliquez pour sélectionner</p>
              <Button variant="outline" onClick={handleUploadClick}>
                Sélectionner des fichiers
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
