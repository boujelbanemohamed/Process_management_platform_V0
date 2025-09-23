"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Edit, Share, History, FileText, Eye, Loader2 } from "lucide-react"
import type { Document } from "@/types"

interface DocumentViewerProps {
  documentId: string
}

export function DocumentViewer({ documentId }: DocumentViewerProps) {
  const router = useRouter()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/documents?id=${documentId}`)
        if (!response.ok) {
          throw new Error('Erreur lors du chargement du document')
        }
        const data = await response.json()
        
        // Normaliser les données
        const normalizedDocument = {
          ...data,
          id: String(data.id),
          uploadedAt: data.uploaded_at ? new Date(data.uploaded_at) : new Date(),
          uploadedBy: String(data.uploaded_by || 1),
          processId: String(data.process_id || ''),
          description: data.description || '',
          size: Number(data.size) || 0,
          version: data.version || '1.0',
          type: data.type || 'unknown',
          name: data.name || 'Sans nom',
          url: data.url || '#'
        }
        
        setDocument(normalizedDocument)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
        console.error('Error fetching document:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDocument()
  }, [documentId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement du document...</span>
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

  if (!document) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500">Document non trouvé</p>
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

  const handleDownload = () => {
    const directUrl = document?.url
    const fallbackUrl = `/api/documents/download?id=${documentId}`
    const link = window.document.createElement("a")
    link.href = directUrl || fallbackUrl
    if (directUrl) link.download = document?.name || "document"
    link.target = "_blank"
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
  }

  const handleEdit = () => {
    router.push(`/documents/${documentId}/edit`)
  }

  const handleShare = async () => {
    try {
      const shareUrl = window.location.href
      if (navigator.share) {
        await navigator.share({ title: document?.name || "Document", url: shareUrl })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl)
        alert("Lien copié dans le presse-papiers")
      } else {
        prompt("Copiez le lien:", shareUrl)
      }
    } catch (e) {
      console.error("Share failed", e)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 text-balance">{document.name}</h1>
          <p className="text-slate-600 mt-1">Version {document.version}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share className="h-4 w-4 mr-2" />
            Partager
          </Button>
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button size="sm" className="bg-slate-800 hover:bg-slate-700" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Preview */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Aperçu du document
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-100 rounded-lg p-8 text-center min-h-96 flex items-center justify-center">
                <div>
                  <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">Aperçu du document</p>
                  <p className="text-sm text-slate-500 mt-2">
                    {document.type?.toUpperCase() || 'UNKNOWN'} • {formatFileSize(document.size || 0)}
                  </p>
                  {document.url && document.url !== '#' && (
                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(document.url, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ouvrir le document
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 text-left">
                <p className="text-sm font-medium text-slate-700 mb-1">Description</p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{document.description || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document Info */}
        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-800">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-600">Processus associé</p>
                <Badge variant="outline" className="mt-1">
                  {document.process_name || "Processus inconnu"}
                </Badge>
                <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">
                  {document.description || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Type de fichier</p>
                <p className="text-sm text-slate-800 mt-1">{document.type.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Taille</p>
                <p className="text-sm text-slate-800 mt-1">{formatFileSize(document.size)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Version</p>
                <p className="text-sm text-slate-800 mt-1">{document.version}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Importé le</p>
                <p className="text-sm text-slate-800 mt-1">{document.uploadedAt.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Importé par</p>
                <p className="text-sm text-slate-800 mt-1">Utilisateur #{document.uploadedBy}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center">
                <History className="h-5 w-5 mr-2" />
                Historique des versions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Version {document.version}</p>
                    <p className="text-xs text-slate-500">{document.uploadedAt.toLocaleDateString()}</p>
                  </div>
                  <Badge>Actuelle</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border border-slate-200 rounded">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Version 1.0</p>
                    <p className="text-xs text-slate-500">15/01/2024</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
