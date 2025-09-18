"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { mockDocuments, mockProcesses } from "@/lib/data"
import { ArrowLeft, Save, Upload } from "lucide-react"
import type { Document } from "@/types"

interface DocumentEditFormProps {
  documentId: string
}

export function DocumentEditForm({ documentId }: DocumentEditFormProps) {
  const router = useRouter()
  const [document] = useState<Document | null>(mockDocuments.find((d) => d.id === documentId) || null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: document?.name || "",
    processId: document?.processId || "",
    description: "",
  })

  if (!document) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500">Document non trouvé</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsLoading(false)
    router.push(`/documents/${documentId}`)
  }

  const handleNewVersion = async () => {
    setIsLoading(true)

    // Simulate new version upload
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Modifier le document</h1>
          <p className="text-slate-600 mt-1">{document.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit Form */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800">Informations du document</CardTitle>
            <CardDescription>Modifiez les métadonnées du document</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom du document</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nom du document"
                />
              </div>

              <div>
                <Label htmlFor="processId">Processus associé</Label>
                <select
                  id="processId"
                  value={formData.processId}
                  onChange={(e) => setFormData({ ...formData, processId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="">Sélectionner un processus</option>
                  {mockProcesses.map((process) => (
                    <option key={process.id} value={process.id}>
                      {process.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du document..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isLoading} className="bg-slate-800 hover:bg-slate-700">
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Enregistrement..." : "Enregistrer"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Version Management */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800">Gestion des versions</CardTitle>
            <CardDescription>Téléchargez une nouvelle version du document</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-slate-600">
              <p>
                Version actuelle: <span className="font-medium">{document.version}</span>
              </p>
              <p>Dernière modification: {document.uploadedAt.toLocaleDateString()}</p>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600 mb-3">Télécharger une nouvelle version</p>
              <Input
                type="file"
                className="hidden"
                id="version-upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              />
              <Label htmlFor="version-upload">
                <Button
                  variant="outline"
                  className="cursor-pointer bg-transparent"
                  disabled={isLoading}
                  onClick={handleNewVersion}
                >
                  {isLoading ? "Téléchargement..." : "Sélectionner un fichier"}
                </Button>
              </Label>
            </div>

            <div className="text-xs text-slate-500">
              <p>• La nouvelle version remplacera la version actuelle</p>
              <p>• L'ancienne version sera conservée dans l'historique</p>
              <p>• Formats acceptés: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
